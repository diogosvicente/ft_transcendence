from channels.generic.websocket import AsyncWebsocketConsumer
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope["user"].id  # Certifique-se de que o usuário está autenticado
        self.room_group_name = f"user_{self.user_id}"  # Grupo único para cada usuário

        # Adiciona o WebSocket ao grupo específico do usuário
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Remove o WebSocket do grupo específico do usuário
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        receiver_id = data.get("payload", {}).get("receiver_id")  # ID do destinatário
        text = data.get("payload", {}).get("text")  # Conteúdo da mensagem
        sender_id = self.user_id  # ID do remetente

        # Envia a mensagem apenas para o grupo do destinatário
        if receiver_id:
            await self.channel_layer.group_send(
                f"user_{receiver_id}",
                {
                    "type": "chat_message",
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "text": text,
                    "timestamp": data.get("payload", {}).get("timestamp"),
                }
            )

    async def chat_message(self, event):
        # Envia a mensagem recebida para o WebSocket
        await self.send(text_data=json.dumps({
            "type": "chat",
            "sender_id": event["sender_id"],
            "receiver_id": event["receiver_id"],
            "text": event["text"],
            "timestamp": event["timestamp"],
        }))
