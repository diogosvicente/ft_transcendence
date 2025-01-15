import json

from channels.generic.websocket import AsyncWebsocketConsumer

from .game_manager import GameManager

game_manager = GameManager()


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "pong_room"
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # send initial game state on connection
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "game.state", "message": game_manager.state}
        )

        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json["action"]

        if action == "start_game":
            await game_manager.start_game(self.group_name)
            await self.send(text_data=json.dumps({"message": "Game started!"}))

        elif action == "stop_game":
            await game_manager.stop_game()
            await self.send(text_data=json.dumps({"message": "Game stopped!"}))

    async def game_state(self, event):
        await self.send(text_data=json.dumps(event["message"]))

