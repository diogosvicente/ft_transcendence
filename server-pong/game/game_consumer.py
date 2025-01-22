from channels.generic.websocket import AsyncWebsocketConsumer
import json
import random
import asyncio

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope["user"].id
        self.match_id = self.scope["url_route"]["kwargs"]["match_id"]
        self.room_group_name = f"match_{self.match_id}"

        # Inicializa o estado do jogo para a partida atual
        if not hasattr(self.channel_layer, "game_state"):
            self.channel_layer.game_state = {}

        if self.match_id not in self.channel_layer.game_state:
            self.channel_layer.game_state[self.match_id] = {
                "players": {},
                "paddles": {"left": 300, "right": 300},
                "ball": {"x": 400, "y": 300, "speed_x": 0, "speed_y": 0},
            }

        game_state = self.channel_layer.game_state[self.match_id]

        # Define o lado do jogador
        if len(game_state["players"]) < 2:
            assigned_side = "left" if "left" not in game_state["players"].values() else "right"
            game_state["players"][self.user_id] = assigned_side
            self.assigned_side = assigned_side
        else:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        print(f"Jogador {self.user_id} atribuído ao lado {self.assigned_side}")

        await self.send(text_data=json.dumps({
            "type": "assigned_side",
            "side": self.assigned_side,
            "player_id": self.user_id,
        }))

        await self.channel_layer.group_send(self.room_group_name, {
            "type": "player_join",
            "player_id": self.user_id,
            "side": self.assigned_side,
        })

        if len(game_state["players"]) == 2:
            await self.start_game_countdown()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        game_state = self.channel_layer.game_state[self.match_id]
        if self.user_id in game_state["players"]:
            del game_state["players"][self.user_id]

        await self.channel_layer.group_send(self.room_group_name, {
            "type": "player_disconnect",
            "player_id": self.user_id,
        })

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")

        if message_type == "player_move":
            direction = data.get("direction")
            paddle_side = self.assigned_side
            game_state = self.channel_layer.game_state[self.match_id]
            current_position = game_state["paddles"][paddle_side]

            if direction == "up":
                new_position = max(0, current_position - 10)
            elif direction == "down":
                new_position = min(600 - 100, current_position + 10)

            game_state["paddles"][paddle_side] = new_position

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "paddle_move",
                    "paddle": paddle_side,
                    "position": new_position,
                }
            )

    async def start_game_countdown(self):
        for i in range(3, 0, -1):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "countdown",
                    "message": str(i),
                }
            )
            await asyncio.sleep(1)

        game_state = self.channel_layer.game_state[self.match_id]
        game_state["ball"]["speed_x"] = random.choice([-5, 5])
        game_state["ball"]["speed_y"] = random.choice([-3, 3])

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "start_game",
                "ball_direction": {
                    "x": game_state["ball"]["speed_x"],
                    "y": game_state["ball"]["speed_y"],
                },
            }
        )

    async def countdown(self, event):
        await self.send(text_data=json.dumps({
            "type": "countdown",
            "message": event["message"],
        }))

    async def start_game(self, event):
        await self.send(text_data=json.dumps({
            "type": "start_game",
            "ball_direction": event["ball_direction"],
        }))

    async def paddle_move(self, event):
        await self.send(text_data=json.dumps({
            "type": "player_move",
            "paddle": event["paddle"],
            "position": event["position"],
        }))

    async def player_join(self, event):
        await self.send(text_data=json.dumps({
            "type": "player_join",
            "player_id": event["player_id"],
            "side": event["side"],
        }))

    async def player_disconnect(self, event):
        await self.send(text_data=json.dumps({
            "type": "player_disconnect",
            "player_id": event["player_id"],
        }))
