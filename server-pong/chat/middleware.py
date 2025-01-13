import os
from channels.db import database_sync_to_async
from django.conf import settings
from django.contrib.auth.models import AnonymousUser

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "setup.settings")

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        from rest_framework_simplejwt.backends import TokenBackend  # Importa dinamicamente
        from django.contrib.auth import get_user_model

        User = get_user_model()

        async def get_user(user_id):
            try:
                return await database_sync_to_async(User.objects.get)(id=user_id)
            except User.DoesNotExist:
                return AnonymousUser()

        query_string = scope["query_string"].decode("utf-8")
        params = dict(pair.split("=") for pair in query_string.split("&"))
        token = params.get("token")
        user_id = params.get("id")

        if token and user_id:
            try:
                # Decodifica e valida o token
                token_backend = TokenBackend(algorithm=settings.SIMPLE_JWT["ALGORITHM"])
                decoded_data = token_backend.decode(token, verify=True)

                # Verifica se o user_id no token corresponde ao user_id passado
                if str(decoded_data["user_id"]) == user_id:
                    scope["user"] = await get_user(user_id)
                else:
                    scope["user"] = AnonymousUser()
            except Exception as e:
                print(f"Erro ao autenticar WebSocket: {e}")
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)
