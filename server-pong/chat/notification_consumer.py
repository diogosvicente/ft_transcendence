from channels.generic.websocket import AsyncWebsocketConsumer
import json

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope["user"].id  # Certifique-se de que o usuário está autenticado
        self.room_group_name = f"user_{self.user_id}"  # Grupo único para cada usuário

        # Adiciona o WebSocket ao grupo específico do usuário
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Adiciona o WebSocket ao grupo global de torneios
        await self.channel_layer.group_add(
            "tournaments",  # Grupo global para notificações de torneios
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Remove o WebSocket do grupo específico do usuário
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        # Remove o WebSocket do grupo global de torneios
        await self.channel_layer.group_discard(
            "tournaments",
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type", "notification")

        print(f"Mensagem recebida: {data}")  # Log para debug

        if not message_type:
            await self.send(text_data=json.dumps({
                "error": "Tipo de mensagem inválido."
            }))
            return

        if message_type == "notification":
            receiver_id = data.get("receiver_id")
            message = data.get("message")
            if receiver_id:
                # Envia mensagem para um grupo específico do usuário
                await self.channel_layer.group_send(
                    f"user_{receiver_id}",
                    {
                        "type": "notification_message",
                        "message": message,
                        "receiver_id": receiver_id,
                    }
                )

        elif message_type == "tournament":
            tournament = data.get("tournament", {})
            if tournament and isinstance(tournament, dict) and "id" in tournament:
                # Garante que todos os campos necessários estão presentes
                complete_tournament = {
                    "id": tournament.get("id"),
                    "name": tournament.get("name"),
                    "created_at": tournament.get("created_at", "N/A"),
                    "status": tournament.get("status", "unknown"),
                    "creator_alias": tournament.get("creator_alias", "N/A"),
                    "creator_display_name": tournament.get("creator_display_name", "N/A"),
                    "creator_id": tournament.get("creator_id"),
                    "total_participants": tournament.get("total_participants", 0),
                    "user_alias": tournament.get("user_alias"),
                    "user_registered": tournament.get("user_registered", False),
                }
                print(f"Torneio processado: {complete_tournament}")  # Log para debug
                # Envia mensagem para o grupo global de torneios
                await self.channel_layer.group_send(
                    "tournaments",
                    {
                        "type": "tournament_message",
                        "tournament": complete_tournament,
                    }
                )

        elif message_type == "tournament_update":
            tournament = data.get("tournament", {})
            if tournament and isinstance(tournament, dict) and "id" in tournament:
                updated_tournament = {
                    "id": tournament.get("id"),
                    "name": tournament.get("name", "Torneio Desconhecido"),
                    "total_participants": tournament.get("total_participants", 0),
                }
                print(f"Atualização de torneio processada: {updated_tournament}")  # Log para depuração

                # Envia mensagem de atualização para o grupo global de torneios
                await self.channel_layer.group_send(
                    "tournaments",
                    {
                        "type": "tournament_update_message",
                        "tournament": updated_tournament,
                    }
                )


    async def notification_message(self, event):
        # Envia uma mensagem de notificação ao WebSocket do cliente
        await self.send(text_data=json.dumps({
            "type": "notification",
            "message": event["message"],
            "receiver_id": event["receiver_id"],
        }))

    async def tournament_message(self, event):
        # Envia uma mensagem de torneio ao WebSocket do cliente
        await self.send(text_data=json.dumps({
            "type": "tournament",
            "tournament": event.get("tournament", {}),
        }))

    async def tournament_update_message(self, event):
        # Filtra mensagens inválidas ou duplicadas
        tournament = event.get("tournament", {})
        if not tournament.get("id") or tournament.get("total_participants", 0) < 0:
            print("Mensagem de atualização ignorada devido a dados inconsistentes.")
            return

        # Envia ao WebSocket apenas mensagens válidas
        await self.send(text_data=json.dumps({
            "type": "tournament_update",
            "tournament": tournament,
        }))