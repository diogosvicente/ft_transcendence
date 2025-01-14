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

        query_string = parse_qs(scope["query_string"].decode())
        token = query_string.get("access_token", [None])[0]

        if token:
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

                user = await self.get_user(payload)
                scope["user"] = user
            except jwt.ExpiredSignatureError:
                scope["user"] = LazyAnonymousUser()
            except jwt.InvalidTokenError:
                scope["user"] = LazyAnonymousUser()
        else:
            scope["user"] = LazyAnonymousUser()

        return await super().__call__(scope, receive, send)

    @staticmethod
    async def get_user(payload):
        """
        Recupera o usuário com base no payload do token.
        """
        User = get_user_model()
        try:
            user_id = payload["user_id"]
            user = await User.objects.aget(id=user_id)
            return user
        except User.DoesNotExist:
            return LazyAnonymousUser()
        except KeyError:
            return LazyAnonymousUser()

