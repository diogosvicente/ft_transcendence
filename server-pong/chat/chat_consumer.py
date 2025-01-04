from channels.generic.websocket import AsyncWebsocketConsumer
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope["user"].id
        self.room_group_name = f"user_{self.user_id}"

        # Adiciona o WebSocket ao grupo específico do usuário
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print(f"Usuário {self.user_id} conectado ao grupo {self.room_group_name}")

    async def disconnect(self, close_code):
        # Remove o WebSocket do grupo específico do usuário
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"Usuário {self.user_id} desconectado do grupo {self.room_group_name}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")
            if message_type == "notification":
                group_name = f"user_{self.user_id}"  # Notificações são enviadas ao próprio usuário
                await self.channel_layer.group_send(
                    group_name,
                    {
                        "type": "notification_message",  # Tipo de mensagem tratado no método abaixo
                        "message": data.get("message"),
                    }
                )
            elif message_type == "chat":
                receiver_id = data.get("receiver_id")
                text = data.get("text")
                sender_id = self.user_id
                timestamp = data.get("timestamp")

                group_name = f"user_{receiver_id}" if receiver_id != "global" else "user_global"

                await self.channel_layer.group_send(
                    group_name,
                    {
                        "type": "chat_message",
                        "sender_id": sender_id,
                        "receiver_id": receiver_id,
                        "text": text,
                        "timestamp": timestamp,
                    }
                )
        except Exception as e:
            print(f"Erro ao processar mensagem recebida: {e}")

    async def chat_message(self, event):
        """
        Método para lidar com mensagens do tipo 'chat_message'.
        """
        try:
            print(f"Mensagem recebida no chat_message: {event}")
            await self.send(text_data=json.dumps({
                "type": "chat",
                "sender_id": event["sender_id"],
                "receiver_id": event["receiver_id"],
                "text": event["text"],
                "timestamp": event["timestamp"],
            }))
        except Exception as e:
            print(f"Erro no chat_message: {e}")

    async def notification_message(self, event):
        """
        Método para lidar com mensagens do tipo 'notification_message'.
        """
        try:
            print(f"Notificação recebida no notification_message: {event}")
            await self.send(text_data=json.dumps({
                "type": "notification",
                "message": event["message"],
            }))
        except Exception as e:
            print(f"Erro no notification_message: {e}")
