from channels.generic.websocket import AsyncWebsocketConsumer
import json

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope["user"].id  # ID do usuário autenticado
        self.match_id = self.scope["url_route"]["kwargs"].get("match_id")  # ID da partida
        self.room_group_name = f"match_{self.match_id}"  # Nome do grupo da sala

        # Adiciona o consumidor ao grupo da partida
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Remove o consumidor do grupo da partida
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        # Notifica os outros jogadores sobre a desconexão
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "player_disconnect",
                "message": f"Jogador {self.user_id} desconectado."
            }
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")

        if message_type == "game_update":
            # Envia atualizações do estado do jogo para o grupo
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "game_update",
                    "ball_position": data.get("ball_position"),
                    "player_positions": data.get("player_positions"),
                    "score": data.get("score"),
                }
            )

        elif message_type == "player_action":
            # Envia ações individuais dos jogadores para o grupo
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "player_action",
                    "player_id": self.user_id,
                    "action": data.get("action"),
                }
            )

    async def game_update(self, event):
        # Envia atualizações do jogo para os clientes
        await self.send(text_data=json.dumps({
            "type": "game_update",
            "ball_position": event.get("ball_position"),
            "player_positions": event.get("player_positions"),
            "score": event.get("score"),
        }))

    async def player_action(self, event):
        # Notifica as ações dos jogadores
        await self.send(text_data=json.dumps({
            "type": "player_action",
            "player_id": event.get("player_id"),
            "action": event.get("action"),
        }))

    async def player_disconnect(self, event):
        # Notifica os jogadores sobre a desconexão de um jogador
        await self.send(text_data=json.dumps({
            "type": "player_disconnect",
            "message": event.get("message"),
        }))
