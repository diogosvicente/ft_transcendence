import json
import asyncio
import redis
from channels.generic.websocket import AsyncWebsocketConsumer

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.user_id = self.scope["user"].id
            self.match_id = self.scope["url_route"]["kwargs"]["match_id"]
            self.room_group_name = f"match_{self.match_id}"

            print(f"Conexão recebida para match_id: {self.match_id}, Usuário: {self.user_id}")
            # access_token = self.scope["query_string"].decode().split("access_token=")[-1]
            # print(f"Access Token: {access_token}")


            # Conecta ao Redis e valida a conexão
            try:
                self.redis = redis.StrictRedis(host="127.0.0.1", port=6380, db=0, decode_responses=True)
                self.redis.ping()
                print("Conexão com Redis estabelecida.")
            except redis.ConnectionError as e:
                print(f"Erro ao conectar ao Redis: {e}")
                await self.close()
                return

            # Inicializa o estado do jogo
            if not self.redis.exists(self.match_id):
                self.redis.set(
                    self.match_id,
                    json.dumps({
                        "players": {},
                        "paddles": {"left": 300, "right": 300},
                        "ball": {"x": 400, "y": 300, "speed_x": 0, "speed_y": 0},
                        "scores": {"left": 0, "right": 0},
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
                print("Sala cheia. Fechando conexão.")
                await self.close()
                return

            # Adiciona o jogador ao grupo WebSocket
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

            await self.accept()
            print(f"Jogador {self.user_id} conectado e aceito no grupo {self.room_group_name}.")

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

        except Exception as e:
            print(f"Erro ao conectar jogador: {e}")
            await self.close()

    async def disconnect(self, close_code):
        try:
            # Remove jogador do estado do jogo
            game_state = json.loads(self.redis.get(self.match_id))
            if str(self.user_id) in game_state["players"]:
                del game_state["players"][str(self.user_id)]
                self.redis.set(self.match_id, json.dumps(game_state))

            # Remove o jogador do grupo WebSocket
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            print(f"Jogador {self.user_id} desconectado do grupo {self.room_group_name}, Código: {close_code}")
        except Exception as e:
            print(f"Erro ao desconectar jogador {self.user_id}: {e}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            print(f"Mensagem recebida do jogador {self.user_id}: {data}")

            # Obtém o estado do jogo do Redis
            game_state = json.loads(self.redis.get(self.match_id))

            # Verifica o status da partida salvo no Redis
            match_status = game_state.get("status", "ongoing")

            # Lógica de movimentação (bloqueada se a partida estiver pausada)
            if data["type"] == "player_move":
                if match_status == "paused":
                    print(f"Movimentação bloqueada: a partida {self.match_id} está pausada.")
                    return  # Ignora o movimento

                direction = data.get("direction")
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

            # Lógica para pausar a partida
            elif data["type"] == "pause_game":
                if match_status != "ongoing":
                    print(f"Não é possível pausar a partida {self.match_id} pois já está em estado {match_status}.")
                    return  # Apenas pode pausar se estiver em andamento

                # Atualiza o estado no Redis
                game_state["status"] = "paused"
                self.redis.set(self.match_id, json.dumps(game_state))

                print(f"Partida {self.match_id} pausada por jogador {self.user_id}.")
                await self.send_to_group("paused", {"message": "A partida foi pausada."})

            # Lógica para retomar a partida
            elif data["type"] == "resume_game":
                if match_status != "paused":
                    print(f"Não é possível retomar a partida {self.match_id} pois está em estado {match_status}.")
                    return  # Apenas pode retomar se estiver pausada

                # Atualiza o estado no Redis
                game_state["status"] = "ongoing"
                self.redis.set(self.match_id, json.dumps(game_state))

                print(f"Partida {self.match_id} retomada por jogador {self.user_id}.")
                await self.send_to_group("resumed", {"message": "A partida foi retomada."})

        except Exception as e:
            print(f"Erro ao processar mensagem recebida: {e}")


    async def start_countdown(self):
        try:
            for i in range(3, 0, -1):
                print(f"Enviando contagem regressiva: {i}")
                await self.send_to_group("countdown", {"message": str(i)})
                await asyncio.sleep(1)

            # Após a contagem, inicializa a bola
            game_state = json.loads(self.redis.get(self.match_id))
            game_state["ball"]["speed_x"] = 100
            game_state["ball"]["speed_y"] = 100
            self.redis.set(self.match_id, json.dumps(game_state))
            print("Contagem regressiva concluída. Jogo iniciado.")
            await self.send_to_group("game_start", {"message": "start"})

        except Exception as e:
            print(f"Erro ao iniciar a contagem regressiva: {e}")

    async def game_loop(self):
        try:
            while True:
                # Carrega o estado do jogo do Redis
                game_state = json.loads(self.redis.get(self.match_id))
                match_status = game_state.get("status", "ongoing")  # Obtém o status do jogo

                # Se o jogo estiver pausado, entra em um loop de espera
                if match_status == "paused":
                    print(f"Partida {self.match_id} pausada. Aguardando retomada...")
                    while match_status == "paused":
                        await asyncio.sleep(1)  # Aguarda 1 segundo antes de verificar novamente
                        game_state = json.loads(self.redis.get(self.match_id))  # Atualiza o estado
                        match_status = game_state.get("status", "ongoing")  # Verifica se foi retomado

                    print(f"Partida {self.match_id} retomada! Continuando jogo...")

                # Continua o processamento da física do jogo
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

                await asyncio.sleep(1 / 60)  # 60 FPS

        except Exception as e:
            print(f"Erro no game loop: {e}")
            await self.close()

    
    async def send_to_group(self, message_type, data):
        try:
            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "game_update", "message_type": message_type, "state": data}
            )
        except Exception as e:
            print(f"Erro ao enviar mensagem para o grupo {self.room_group_name}: {e}")

    async def game_update(self, event):
        try:
            await self.send(json.dumps({
                "type": event["message_type"],
                "state": event["state"],
            }))
        except Exception as e:
            print(f"Erro ao enviar atualização para o WebSocket: {e}")
