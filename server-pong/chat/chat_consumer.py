import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from django.conf import settings

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
        message = text_data_json.get("text", "")
        sender_id = text_data_json.get("sender", "")
        timestamp = text_data_json.get("timestamp", "")

        try:
            user = await User.objects.aget(id=sender_id)
            avatar_url = (
                f"{settings.MEDIA_URL}{user.avatar}" if user.avatar else f"{settings.MEDIA_URL}avatars/default.png"
            )
            display_name = user.display_name
        except User.DoesNotExist:
            avatar_url = f"{settings.MEDIA_URL}avatars/default.png"
            display_name = "Usuário Desconhecido"

        # Envia a mensagem para todos no grupo
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "sender": sender_id,
                "avatar": avatar_url,
                "display_name": display_name,
                "timestamp": timestamp,
            }
        )

    async def chat_message(self, event):
        # Envia a mensagem para o WebSocket do cliente
        await self.send(text_data=json.dumps(event))
