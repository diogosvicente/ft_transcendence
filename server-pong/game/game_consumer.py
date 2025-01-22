from channels.generic.websocket import AsyncWebsocketConsumer
import json
import random

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope["user"].id  # ID do usuário autenticado
        self.match_id = self.scope["url_route"]["kwargs"]["match_id"]  # ID da partida
        self.room_group_name = f"match_{self.match_id}"  # Nome do grupo da partida

        # Adiciona o jogador ao grupo da partida
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Atribui aleatoriamente o lado para o jogador
        if not hasattr(self.channel_layer, "game_state"):
            self.channel_layer.game_state = {"players": {}}

        # Atribuir lado apenas se o jogador não estiver conectado
        if self.user_id not in self.channel_layer.game_state["players"]:
            assigned_side = "left" if len(self.channel_layer.game_state["players"]) == 0 else "right"
            self.channel_layer.game_state["players"][self.user_id] = assigned_side
        else:
            assigned_side = self.channel_layer.game_state["players"][self.user_id]

        self.assigned_side = assigned_side

        await self.accept()

        # Notifica o cliente sobre o lado atribuído
        await self.send(text_data=json.dumps({
            "type": "assigned_side",
            "side": self.assigned_side,
        }))

        # Notifica os outros jogadores sobre o novo jogador
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "player_join",
                "player_id": self.user_id,
                "side": self.assigned_side,
            }
        )

    async def disconnect(self, close_code):
        # Remove o jogador do grupo
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        # Remove o jogador do estado do jogo
        if self.user_id in self.channel_layer.game_state["players"]:
            del self.channel_layer.game_state["players"][self.user_id]

        # Notifica os outros jogadores sobre a desconexão
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "player_disconnect",
                "player_id": self.user_id,
            }
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")

        if message_type == "state_update":
            # Envia o estado atualizado do jogo para todos os jogadores
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "game_state",
                    "state": data["state"],
                }
            )

    async def game_state(self, event):
        # Envia o estado do jogo para o cliente
        await self.send(text_data=json.dumps({
            "type": "state_update",
            "state": event["state"],
        }))

    async def player_join(self, event):
        # Notifica os clientes sobre um novo jogador
        await self.send(text_data=json.dumps({
            "type": "player_join",
            "player_id": event["player_id"],
            "side": event["side"],
        }))

    async def player_disconnect(self, event):
        # Notifica os clientes sobre a desconexão de um jogador
        await self.send(text_data=json.dumps({
            "type": "player_disconnect",
            "player_id": event["player_id"],
        }))
