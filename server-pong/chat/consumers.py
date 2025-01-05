from channels.generic.websocket import AsyncWebsocketConsumer
import json

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Obtém o ID do usuário logado (ajuste conforme sua autenticação)
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
        receiver_id = data.get("receiver_id")  # ID do destinatário
        message = data.get("message")  # Conteúdo da mensagem

        # Envia a mensagem apenas para o grupo do destinatário
        if receiver_id:
            await self.channel_layer.group_send(
                f"user_{receiver_id}",  # Grupo do destinatário
                {
                    "type": "notification_message",
                    "message": message,
                    "receiver_id": receiver_id,  # Inclui o receiver_id no evento
                }
            )


    async def notification_message(self, event):
        # Envia a mensagem recebida para o WebSocket
        await self.send(text_data=json.dumps({
            "type": "notification",
            "message": event["message"],
            "receiver_id": event["receiver_id"],
        }))