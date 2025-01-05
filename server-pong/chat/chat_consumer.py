import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from django.conf import settings
from asgiref.sync import sync_to_async
from django.core.cache import cache

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room']  # Room dinâmico
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get("message", "")
        sender = text_data_json.get("sender", "")
        timestamp = text_data_json.get("timestamp", "")

        # Obtém dados do remetente
        user_data = await self.get_user_data(sender)

        # Enviando a mensagem para todos no grupo
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "sender": sender,
                "timestamp": timestamp,
                "avatar": user_data["avatar"],
                "display_name": user_data["display_name"],
            }
        )

    async def chat_message(self, event):
        # Enviar a mensagem para o WebSocket do cliente
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender": event["sender"],
            "timestamp": event["timestamp"],
            "avatar": event["avatar"],
            "display_name": event["display_name"],
        }))

    @sync_to_async
    def get_user_data(self, user_id):
        """
        Busca os dados do usuário do banco de dados. Usa cache para melhorar o desempenho.
        """
        cache_key = f"user_data_{user_id}"
        cached_data = cache.get(cache_key)

        if cached_data:
            return cached_data

        try:
            user = User.objects.only("avatar", "display_name").get(id=user_id)
            avatar_url = user.avatar if user.avatar else "avatars/default.png"

            # Ajusta o caminho do avatar padrão
            if avatar_url == "avatars/default.png":
                avatar_url = f"{settings.MEDIA_URL}avatars/default.png"
            else:
                avatar_url = f"{settings.MEDIA_URL}{avatar_url}"

            user_data = {
                "avatar": avatar_url,
                "display_name": user.display_name or f"Usuário {user_id}",
            }
            # Armazena no cache por 1 hora
            cache.set(cache_key, user_data, timeout=3600)
            return user_data
        except User.DoesNotExist:
            # Caso o usuário não seja encontrado
            return {
                "avatar": f"{settings.MEDIA_URL}avatars/default.png",
                "display_name": f"Usuário Desconhecido",
            }
