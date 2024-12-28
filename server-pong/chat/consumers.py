from channels.generic.websocket import AsyncWebsocketConsumer
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "chat_global"  # Nome do grupo global
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Remove o usuário do grupo global
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
