# user_consumer.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json

class UserStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

        # Adiciona o usuário ao grupo de status global
        await self.channel_layer.group_add("user_status_updates", self.channel_name)

    async def disconnect(self, close_code):
        # Remove o usuário do grupo de status global
        await self.channel_layer.group_discard("user_status_updates", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        user_id = data.get("user_id")
        online_status = data.get("online_status")

        # Envia a atualização para o grupo
        await self.channel_layer.group_send(
            "user_status_updates",
            {
                "type": "user_status_update",
                "user_id": user_id,
                "online_status": online_status,
            },
        )

    async def user_status_update(self, event):
        # Envia a mensagem para o cliente WebSocket
        await self.send(text_data=json.dumps({
            "type": "user_status_update",
            "user_id": event["user_id"],
            "online_status": event["online_status"],
        }))
