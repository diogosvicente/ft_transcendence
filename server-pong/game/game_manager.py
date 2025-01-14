import asyncio

from channels.layers import get_channel_layer


class GameManager:
    def __init__(self):
        self.running = False
        self.state = {"player1": {}, "player2": {}, "isRunning": self.running}
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
            await self.channel_layer.group_send(
                group_name,
                {"type": "game.state", "message": self.state}
            )
            await asyncio.sleep(1)

