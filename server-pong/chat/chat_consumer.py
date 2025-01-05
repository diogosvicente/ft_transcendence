import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # O nome da sala será "global" para o chat global
        self.room_name = "global"
        self.room_group_name = f"chat_{self.room_name}"

        # Adicionar o cliente ao grupo da sala
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Aceitar a conexão WebSocket
        await self.accept()
        print(f"Cliente conectado à sala: {self.room_group_name}")

    async def disconnect(self, close_code):
        # Remover o cliente do grupo da sala
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"Cliente desconectado da sala: {self.room_group_name}")

    async def receive(self, text_data):
        # Receber dados enviados pelo cliente
        text_data_json = json.loads(text_data)
        message = text_data_json.get("text", "")
        sender = text_data_json.get("sender", "Unknown")
        timestamp = text_data_json.get("timestamp", "")

        # Broadcast da mensagem para todos no grupo
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "sender": sender,
                "timestamp": timestamp,
            }
        )

    async def chat_message(self, event):
        # Enviar mensagem para o WebSocket do cliente
        message = event["message"]
        sender = event["sender"]
        timestamp = event["timestamp"]

        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "text": message,
            "sender": sender,
            "timestamp": timestamp,
        }))
