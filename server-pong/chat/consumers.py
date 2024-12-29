from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "chat_global"  # Nome do grupo global
        user = self.scope["user"]

        # Verifica se o usuário está autenticado
        if user.is_authenticated:
            await self.update_online_status(user, True)  # Marca o usuário como online

        # Adiciona o canal do usuário ao grupo global
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        user = self.scope["user"]

        # Verifica se o usuário está autenticado
        if user.is_authenticated:
            await self.update_online_status(user, False)  # Marca o usuário como offline

        # Remove o canal do usuário do grupo global
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message")
        sender = self.scope["user"].email if self.scope.get("user") else "Anonymous"
        recipient = data.get("recipient")

        if recipient:  # Mensagem privada
            await self.channel_layer.group_send(
                f"user_{recipient}",
                {
                    "type": "private_message",
                    "message": message,
                    "sender": sender,
                },
            )
        else:  # Mensagem global
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": message,
                    "sender": sender,
                },
            )

    async def chat_message(self, event):
        # Envia mensagem global para o WebSocket
        await self.send(text_data=json.dumps({
            "type": "global",
            "message": event["message"],
            "sender": event["sender"],
        }))

    async def private_message(self, event):
        # Envia mensagem privada para o WebSocket
        await self.send(text_data=json.dumps({
            "type": "private",
            "message": event["message"],
            "sender": event["sender"],
        }))

    @database_sync_to_async
    def update_online_status(self, user, status):
        # Atualiza o status de online no banco de dados
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.online_status = status
        if not status:  # Se o usuário está offline, atualiza o `last_seen`
            profile.last_seen = datetime.now()
        profile.save()
