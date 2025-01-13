import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Obtém o ID do usuário da sessão ou token de autenticação
        self.user_id = self.scope["user"].id  # Substitua por lógica de autenticação que retorna o ID do usuário
        self.group_name = f"user_{self.user_id}"  # Grupo com base no ID do usuário

        # Adiciona o cliente ao grupo específico
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        print(f"WebSocket conectado para o usuário {self.user_id}")

    async def disconnect(self, close_code):
        # Remove o cliente do grupo específico
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        print(f"WebSocket desconectado para o usuário {self.user_id}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        print(f"Mensagem recebida no WebSocket (usuário {self.user_id}):", data)

        if data["type"] == "notification" and "recipient_id" in data:
            recipient_id = data["recipient_id"]
            # Envia para o grupo do destinatário
            await self.channel_layer.group_send(
                f"user_{recipient_id}",
                {
                    "type": "send_notification",  # Método a ser chamado
                    "message": data["content"],   # Mensagem a ser enviada
                },
            )

    async def send_notification(self, event):
        # Envia a mensagem para o WebSocket do cliente
        await self.send(text_data=json.dumps({
            "message": event["message"]
        }))

from channels.layers import get_channel_layer
import asyncio

channel_layer = get_channel_layer()

async def send_notification():
    await channel_layer.group_send(
        "user_<recipient_id>",  # Substitua pelo ID do destinatário ou use "notifications" para todos
        {
            "type": "send_notification",
            "message": "Este é um teste de alerta para todos os usuários conectados!",
        }
    )

asyncio.run(send_notification())
