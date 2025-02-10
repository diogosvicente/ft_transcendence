import asyncio

from channels.layers import get_channel_layer


class GameManager:
    def __init__(self):
        self.running = False
        self.state = {
            "player1": {
                "position": 0, # y-coordinate
            },
            "player2": {
                "position": 0,
            },
            "ball": {
                "position": {"x": 0, "y": 0},
                "velocity": {"x": 5, "y": 3},
            },
        }
        self.channel_layer = get_channel_layer()
        self.loop_task = None

    async def start_game(self, group_name):
        if not self.running:
            self.running = True
            self.loop_task = asyncio.create_task(self.game_loop(group_name))

    async def stop_game(self):
        if self.running:
            self.running = False
            if self.loop_task:
                self.loop_task.cancel()

    async def game_loop(self, group_name):
        while self.running:
            await self.move_ball()

            await self.channel_layer.group_send(
                group_name,
                {"type": "game.state", "message": self.state}
            )
            await asyncio.sleep(1/30)

    async def move_ball(self):
        ball = self.state["ball"]
        new_position = {
            "x": ball["position"]["x"] + ball["velocity"]["x"],
            "y": ball["position"]["y"] + ball["velocity"]["y"]
        }
        ball["position"] = new_position

        # horizontal collision
        if (ball["position"]["x"] >= 800
            or ball["position"]["x"] <= 0):
            ball["velocity"]["x"] = -ball["velocity"]["x"]

        # vertical collision
        if (ball["position"]["y"] >= 590
            or ball["position"]["y"] <= 0):
            ball["velocity"]["y"] = -ball["velocity"]["y"]

