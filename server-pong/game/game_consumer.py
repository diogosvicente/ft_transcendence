import json
import asyncio
import redis
from channels.generic.websocket import AsyncWebsocketConsumer


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope["user"].id
        self.match_id = self.scope["url_route"]["kwargs"]["match_id"]
        self.room_group_name = f"match_{self.match_id}"

        # Conecta ao Redis
        self.redis = redis.StrictRedis(host="127.0.0.1", port=6380, db=0, decode_responses=True)

        # Inicializa o estado do jogo
        if not self.redis.exists(self.match_id):
            self.redis.set(
                self.match_id,
                json.dumps({
                    "players": {},  # Jogadores
                    "paddles": {"left": 300, "right": 300},  # Posição inicial dos paddles
                    "ball": {"x": 400, "y": 300, "speed_x": 0, "speed_y": 0},  # Bola no centro
                    "scores": {"left": 0, "right": 0},  # Placar
                })
            )

        # Adiciona o jogador ao estado do jogo
        game_state = json.loads(self.redis.get(self.match_id))
        if len(game_state["players"]) < 2:
            assigned_side = "left" if "left" not in game_state["players"].values() else "right"
            game_state["players"][str(self.user_id)] = assigned_side
            self.assigned_side = assigned_side
            self.redis.set(self.match_id, json.dumps(game_state))
        else:
            await self.close()  # Sala cheia
            return

        await self.accept()

        # Envia o lado ao jogador
        await self.send(json.dumps({
            "type": "assigned_side",
            "side": self.assigned_side,
            "player_id": self.user_id,
        }))

        # Envia o estado inicial ao jogador
        await self.send(json.dumps({
            "type": "state_update",
            "state": game_state,
        }))

        # Notifica os outros jogadores sobre o novo estado
        await self.send_to_group("state_update", game_state)

        # Inicia o jogo se dois jogadores estiverem conectados
        if len(game_state["players"]) == 2:
            await self.start_countdown()
            asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        # Remove jogador do estado do jogo
        game_state = json.loads(self.redis.get(self.match_id))
        if str(self.user_id) in game_state["players"]:
            del game_state["players"][str(self.user_id)]
            self.redis.set(self.match_id, json.dumps(game_state))

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data["type"] == "player_move":
            direction = data.get("direction")
            game_state = json.loads(self.redis.get(self.match_id))
            paddle = self.assigned_side
            current_position = game_state["paddles"][paddle]

            # Atualiza a posição do paddle
            if direction == "up":
                game_state["paddles"][paddle] = max(0, current_position - 10)
            elif direction == "down":
                game_state["paddles"][paddle] = min(600 - 100, current_position + 10)

            # Salva o estado atualizado no Redis
            self.redis.set(self.match_id, json.dumps(game_state))

            # Envia o estado atualizado para todos os jogadores
            await self.send_to_group("state_update", game_state)

    async def start_countdown(self):
        """Envia a contagem regressiva antes do início do jogo."""
        for i in range(3, 0, -1):
            print(f"Enviando contagem regressiva: {i}")  # Log para debug
            print("Contagem regressiva enviada.")
            await self.send_to_group("countdown", {"message": str(i)})
            await asyncio.sleep(1)
        
        # Após a contagem, inicializa a bola
        game_state = json.loads(self.redis.get(self.match_id))
        game_state["ball"]["speed_x"] = 100
        game_state["ball"]["speed_y"] = 100
        self.redis.set(self.match_id, json.dumps(game_state))
        print("Contagem regressiva concluída. Jogo iniciado.")  # Log para debug
        await self.send_to_group("game_start", {"message": "start"})



    async def game_loop(self):
        """Loop principal do jogo para movimentar a bola e detectar colisões."""
        while True:
            # Carrega o estado do jogo
            game_state = json.loads(self.redis.get(self.match_id))
            ball = game_state["ball"]

            # Atualiza a posição da bola
            ball["x"] += ball["speed_x"] * 0.016
            ball["y"] += ball["speed_y"] * 0.016

            # Detecta colisões com as bordas
            if ball["y"] <= 0 or ball["y"] >= 600:
                ball["speed_y"] = -ball["speed_y"]

            # Detecta colisões com os paddles
            if ball["x"] <= 20 and game_state["paddles"]["left"] <= ball["y"] <= game_state["paddles"]["left"] + 100:
                ball["speed_x"] = -ball["speed_x"]
            if ball["x"] >= 780 and game_state["paddles"]["right"] <= ball["y"] <= game_state["paddles"]["right"] + 100:
                ball["speed_x"] = -ball["speed_x"]

            # Verifica se há pontuações
            if ball["x"] < 0:  # Gol para a direita
                game_state["scores"]["right"] += 1
                ball.update({"x": 400, "y": 300, "speed_x": 200, "speed_y": 200})
            elif ball["x"] > 800:  # Gol para a esquerda
                game_state["scores"]["left"] += 1
                ball.update({"x": 400, "y": 300, "speed_x": -200, "speed_y": -200})

            # Salva e envia o estado atualizado
            self.redis.set(self.match_id, json.dumps(game_state))
            await self.send_to_group("state_update", game_state)

            # Log da mensagem enviada
            # print(f"Mensagem state_update enviada: {game_state}")

            await asyncio.sleep(1 / 60)  # 60 FPS

    async def send_to_group(self, message_type, data):
        """Envia mensagens para todos os jogadores no grupo."""
        # print(f"Enviando mensagem para o grupo {self.room_group_name}: {message_type} - {data}")  # Log para debug
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "game_update", "message_type": message_type, "state": data}
        )

    async def game_update(self, event):
        """Envia mensagens para os WebSockets conectados."""
        print(f"Enviando atualização para WebSocket: {event}")
        await self.send(json.dumps({
            "type": event["message_type"],
            "state": event["state"],
        }))
