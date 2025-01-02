from channels.middleware import BaseMiddleware
from django.utils.functional import LazyObject
from urllib.parse import parse_qs
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model


class LazyAnonymousUser(LazyObject):
    def _setup(self):
        from django.contrib.auth.models import AnonymousUser
        self._wrapped = AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware para autenticação JWT em WebSockets.
    Verifica o token de acesso e autentica o usuário.
    """
    async def __call__(self, scope, receive, send):
        print("JWTAuthMiddleware: Chamado.")
        print(f"Scope inicial: {scope}")

        query_string = parse_qs(scope["query_string"].decode())
        token = query_string.get("access_token", [None])[0]

        print(f"Token recebido na query string: {token}")

        if token:
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                print(f"Payload decodificado: {payload}")

                user = await self.get_user(payload)
                scope["user"] = user
                print(f"Usuário autenticado: {user}")
            except jwt.ExpiredSignatureError:
                print("JWT expirado.")
                scope["user"] = LazyAnonymousUser()
            except jwt.InvalidTokenError:
                print("JWT inválido.")
                scope["user"] = LazyAnonymousUser()
        else:
            print("Token não fornecido.")
            scope["user"] = LazyAnonymousUser()

        print(f"Scope final: {scope}")
        return await super().__call__(scope, receive, send)

    @staticmethod
    async def get_user(payload):
        """
        Recupera o usuário com base no payload do token.
        """
        print("get_user: Chamado.")
        User = get_user_model()
        try:
            user_id = payload["user_id"]
            print(f"Buscando usuário com ID: {user_id}")
            user = await User.objects.aget(id=user_id)
            return user
        except User.DoesNotExist:
            print(f"Usuário com ID {user_id} não encontrado.")
            return LazyAnonymousUser()
        except KeyError:
            print("Payload não contém 'user_id'.")
            return LazyAnonymousUser()
