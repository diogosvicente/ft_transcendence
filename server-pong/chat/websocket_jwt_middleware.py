from channels.middleware import BaseMiddleware
from django.utils.functional import LazyObject
from urllib.parse import parse_qs
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
import logging

logger = logging.getLogger(__name__)

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
                logger.info(f"Usuário autenticado: {user}")
            except jwt.ExpiredSignatureError:
                logger.warning("Token expirado.")
                scope["user"] = LazyAnonymousUser()
            except jwt.InvalidTokenError:
                logger.warning("Token inválido.")
                scope["user"] = LazyAnonymousUser()
        else:
            logger.info("Token não encontrado na query string.")
            scope["user"] = LazyAnonymousUser()

        return await super().__call__(scope, receive, send)

    @staticmethod
    @database_sync_to_async
    def get_user(payload):
        """
        Recupera o usuário com base no payload do token.
        """
        User = get_user_model()
        user_id = payload.get("user_id")
        if not user_id:
            logger.warning("Payload inválido, 'user_id' ausente.")
            return LazyAnonymousUser()
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.warning(f"Usuário com ID {user_id} não encontrado.")
            return LazyAnonymousUser()
