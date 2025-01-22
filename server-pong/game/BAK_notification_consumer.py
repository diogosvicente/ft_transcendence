from channels.generic.websocket import AsyncWebsocketConsumer
import json

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Identifica o grupo do usuário pelo ID
        self.user_id = self.scope["user"].id
        self.room_group_name = f"user_{self.user_id}"

        # Verifica se o usuário está autenticado
        if self.scope["user"].is_authenticated:
            # Adiciona o usuário ao grupo WebSocket
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            print(f"Usuário {self.user_id} conectado ao WebSocket de notificações.")
        else:
            print("Conexão recusada: Usuário não autenticado.")
            await self.close()

    async def disconnect(self, close_code):
        # Remove o usuário do grupo WebSocket
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"Usuário {self.user_id} desconectado do WebSocket de notificações.")

    async def receive(self, text_data):
        # Loga mensagens recebidas do cliente (se necessário)
        data = json.loads(text_data)
        print(f"Mensagem recebida no WebSocket: {data}")

    async def notification(self, event):
        """
        Processa mensagens do tipo 'notification'.
        """
        message = event["message"]
        payload = event.get("payload", {})

        # Envia a notificação para o cliente
        await self.send(text_data=json.dumps({
            "type": "notification",
            "message": message,
            "payload": payload,
        }))
        print(f"Notificação enviada para o cliente: {message}")
