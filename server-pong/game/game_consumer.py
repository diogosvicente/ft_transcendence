import json
import asyncio
import redis
from datetime import datetime, timedelta
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
# Importa o modelo para atualização no banco de dados (supondo que o app seja "game")
from game.models import Match as GameMatch

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.user_id = self.scope["user"].id
            self.match_id = self.scope["url_route"]["kwargs"]["match_id"]
            self.room_group_name = f"match_{self.match_id}"
            
            print(f"Conexão recebida para match_id: {self.match_id}, Usuário: {self.user_id}")
            
            # Conecta ao Redis e valida a conexão
            try:
                self.redis = redis.StrictRedis(host="127.0.0.1", port=6380, db=0, decode_responses=True)
                self.redis.ping()
                print("Conexão com Redis estabelecida.")
            except redis.ConnectionError as e:
                print(f"Erro ao conectar ao Redis: {e}")
                await self.close()
                return

            # Inicializa o estado do jogo se ainda não existir
            if not self.redis.exists(self.match_id):
                initial_state = {
                    "players": {},
                    "paddles": {"left": 300, "right": 300},
                    "ball": {"x": 400, "y": 300, "speed_x": 0, "speed_y": 0},
                    "scores": {"left": 0, "right": 0},
                    "initial_players": []
                }
                self.redis.set(self.match_id, json.dumps(initial_state))

            # Recupera o estado atual do jogo
            game_state = json.loads(self.redis.get(self.match_id))

            # Verifica se o jogador já está na partida (reconexão)
            if str(self.user_id) in game_state["players"]:
                self.assigned_side = game_state["players"][str(self.user_id)]
                print(f"Reconexão detectada para o jogador {self.user_id} no lado {self.assigned_side}.")
            else:
                # Se houver espaço, adiciona o jogador
                if len(game_state["players"]) < 2:
                    assigned_side = "left" if "left" not in game_state["players"].values() else "right"
                    game_state["players"][str(self.user_id)] = assigned_side
                    self.assigned_side = assigned_side
                    # Registra em 'initial_players'
                    if "initial_players" not in game_state or not game_state["initial_players"]:
                        game_state["initial_players"] = [str(self.user_id)]
                    elif str(self.user_id) not in game_state["initial_players"]:
                        game_state["initial_players"].append(str(self.user_id))
                    self.redis.set(self.match_id, json.dumps(game_state))
                else:
                    print("Sala cheia. Fechando conexão.")
                    await self.close()
                    return

            # Se agora houver dois jogadores e houver os dois lados (left e right) definidos,
            # cancela qualquer WO pendente e inicia a contagem para o início do jogo.
            # ...
            # Após atualizar o estado e adicionar o jogador:
            if len(game_state["players"]) == 2 and set(game_state["players"].values()) == {"left", "right"}:
                # Se houver um WO pendente, cancela-o
                if game_state.get("wo_pending"):
                    game_state.pop("wo_pending", None)
                    game_state.pop("wo_initiated_at", None)
                    self.redis.set(self.match_id, json.dumps(game_state))
                    await self.send_to_group("resumed", {"message": "Jogador retornou. Jogo retomado."})
                    print("WO pendente cancelado – os dois jogadores estão conectados.")
                # Envia o estado inicial e inicia a contagem regressiva
                await self.channel_layer.group_add(self.room_group_name, self.channel_name)
                await self.accept()
                await self.send(json.dumps({
                    "type": "assigned_side",
                    "side": self.assigned_side,
                    "player_id": self.user_id,
                }))
                await self.send(json.dumps({
                    "type": "state_update",
                    "state": game_state,
                }))
                await self.send_to_group("state_update", game_state)
                await self.start_countdown()
                asyncio.create_task(self.game_loop())
            else:
                # Caso ainda não haja dois jogadores, adiciona o jogador e aceita a conexão sem iniciar o countdown
                await self.channel_layer.group_add(self.room_group_name, self.channel_name)
                await self.accept()
                await self.send(json.dumps({
                    "type": "assigned_side",
                    "side": self.assigned_side,
                    "player_id": self.user_id,
                }))
                await self.send(json.dumps({
                    "type": "state_update",
                    "state": game_state,
                }))
                await self.send_to_group("state_update", game_state)
            # ...

        except Exception as e:
            print(f"Erro ao conectar jogador: {e}")
            await self.close()

    async def disconnect(self, close_code):
        try:
            # Tenta recuperar o estado do jogo do Redis
            redis_value = self.redis.get(self.match_id)
            if not redis_value:
                print(f"Estado da partida {self.match_id} não encontrado para o jogador {self.user_id}.")
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
                return

            try:
                game_state = json.loads(redis_value)
            except Exception as e:
                print(f"Erro ao decodificar JSON para partida {self.match_id}: {e}")
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
                return

            # Remove o jogador do estado, se presente
            if str(self.user_id) in game_state["players"]:
                del game_state["players"][str(self.user_id)]
                self.redis.set(self.match_id, json.dumps(game_state))
                print(f"Jogador {self.user_id} removido do estado da partida {self.match_id}.")

            # Verifica quantos jogadores estão conectados
            num_players = len(game_state["players"])
            
            if num_players == 1 and game_state.get("status", "ongoing") == "ongoing":
                # Se sobrar apenas um jogador e o jogo estiver em andamento, pausa o jogo e inicia o WO countdown
                game_state["status"] = "paused"
                game_state["wo_pending"] = True
                from datetime import datetime
                game_state["wo_initiated_at"] = datetime.utcnow().isoformat()
                self.redis.set(self.match_id, json.dumps(game_state))
                await self.send_to_group("wo_countdown", {"message": "Contagem regressiva para WO iniciada.", "countdown": 10})
                print(f"Partida {self.match_id} pausada. Iniciando contagem para WO com 10 segundos. Jogadores restantes: {num_players}")
                asyncio.create_task(self.wo_countdown())
            elif num_players == 0:
                # Se nenhum jogador estiver conectado, remove o estado do Redis
                self.redis.delete(self.match_id)
                print(f"Partida {self.match_id} finalizada e removida – nenhum jogador conectado.")
            
            # Remove o jogador do grupo WebSocket
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            print(f"Jogador {self.user_id} desconectado do grupo {self.room_group_name} (Código: {close_code})")
        except Exception as e:
            print(f"Erro ao desconectar jogador {self.user_id}: {e}")

    
    async def wo_countdown(self):
        """Contagem regressiva de 10 segundos para walkover (WO)."""
        countdown = 10
        while countdown > 0:
            await asyncio.sleep(1)
            countdown -= 1
            await self.send_to_group("wo_countdown", {"message": "Contagem para WO", "countdown": countdown})
            game_state = json.loads(self.redis.get(self.match_id))
            if not game_state.get("wo_pending"):
                print("Contagem WO cancelada – jogador retornou.")
                return

        print(f"Walkover confirmado para a partida {self.match_id}.")
        await self.finalize_match_by_wo()

    async def finalize_match_by_wo(self):
        """
        Finaliza a partida por WO:
        - Atualiza o banco de dados,
        - Envia mensagem 'walkover' com os IDs do vencedor e do perdedor,
        - Remove o estado do jogo.
        """
        game_state = json.loads(self.redis.get(self.match_id))
        # Se houver exatamente 1 jogador conectado, esse será o vencedor
        if len(game_state["players"]) == 1:
            winner_id = list(game_state["players"].keys())[0]
            # Define o perdedor como o jogador que está na lista inicial mas não está na partida
            initial_players = game_state.get("initial_players", [])
            loser_id = None
            for pid in initial_players:
                if pid != winner_id:
                    loser_id = pid
                    break

            await self.send_to_group("walkover", {
                "message": "Partida finalizada por WO.",
                "redirect_url": "/chat/",
                "winner": winner_id,
                "loser": loser_id,
                "final_alert": "Partida finalizada por WO! Clique em OK para sair da partida."
            })
            await sync_to_async(self.update_match_by_wo)(winner_id, loser_id)
        else:
            print("Finalização por WO não executada – quantidade inesperada de jogadores.")

        self.redis.delete(self.match_id)

    
    def update_match_by_wo(self, winner_id, loser_id):
        """
        Atualiza a partida no banco de dados para finalização por WO:
        - Define score 1 para o vencedor e 0 para o perdedor;
        - Define o winner_id com o id do jogador vencedor;
        - Marca a partida como 'completed' e atualiza os timestamps;
        - Incrementa +1 no campo wins do vencedor e +1 no campo losses do perdedor.
        """
        try:
            match = GameMatch.objects.get(pk=self.match_id)
            if str(match.player1_id) == str(winner_id):
                match.score_player1 = 1
                match.score_player2 = 0
            else:
                match.score_player1 = 0
                match.score_player2 = 1
            match.is_winner_by_wo = True
            match.winner_id = winner_id
            match.status = "completed"
            from django.utils import timezone
            match.last_updated = timezone.now()
            match.played_at = timezone.now()
            match.save()

            from django.contrib.auth import get_user_model
            User = get_user_model()
            winner = User.objects.get(pk=winner_id)
            loser = User.objects.get(pk=loser_id)
            winner.wins = (winner.wins or 0) + 1
            loser.losses = (loser.losses or 0) + 1
            winner.save()
            loser.save()
        except Exception as e:
            print(f"Erro ao atualizar partida por WO no banco: {e}")

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
            # Após a contagem, inicia a partida
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
                
                # Verifica o número de jogadores conectados
                num_players = len(game_state["players"])
                if num_players < 2:
                    if game_state.get("status", "ongoing") == "ongoing":
                        game_state["status"] = "paused"
                        self.redis.set(self.match_id, json.dumps(game_state))
                        await self.send_to_group("paused", {"message": "Jogo pausado automaticamente por falta de jogadores."})
                        print(f"Jogo {self.match_id} pausado automaticamente. Jogadores conectados: {num_players}")
                    if num_players == 0:
                        print(f"Finalizando e removendo partida {self.match_id} por falta de jogadores.")
                        self.redis.delete(self.match_id)
                        break
                
                if game_state.get("status") == "paused":
                    await asyncio.sleep(1)
                    continue

                # Processamento da física do jogo (movimento da bola, colisões, etc.)
                ball = game_state["ball"]
                ball["x"] += ball["speed_x"] * 0.016
                ball["y"] += ball["speed_y"] * 0.016

                # Detecção de colisões com as bordas
                if ball["y"] <= 0 or ball["y"] >= 600:
                    ball["speed_y"] = -ball["speed_y"]

                # Detecção de colisões com os paddles
                if ball["x"] <= 20 and game_state["paddles"]["left"] <= ball["y"] <= game_state["paddles"]["left"] + 100:
                    ball["speed_x"] = -ball["speed_x"]
                if ball["x"] >= 780 and game_state["paddles"]["right"] <= ball["y"] <= game_state["paddles"]["right"] + 100:
                    ball["speed_x"] = -ball["speed_x"]

                # Verifica pontuações (quando a bola sai dos limites)
                if ball["x"] < 0:  # Gol para a direita
                    game_state["scores"]["right"] += 1
                    ball.update({"x": 400, "y": 300, "speed_x": 200, "speed_y": 200})
                elif ball["x"] > 800:  # Gol para a esquerda
                    game_state["scores"]["left"] += 1
                    ball.update({"x": 400, "y": 300, "speed_x": -200, "speed_y": -200})

                # Salva e envia o estado atualizado para os clientes
                self.redis.set(self.match_id, json.dumps(game_state))
                await self.send_to_group("state_update", game_state)

                # Se algum jogador atingir 5 pontos, envia o update final e finaliza a partida
                if game_state["scores"]["left"] >= 5 or game_state["scores"]["right"] >= 5:
                    print("Limite de pontos atingido. Finalizando partida por pontuação.")
                    # Envia o update final (garantindo que o 5º ponto esteja no placar)
                    self.redis.set(self.match_id, json.dumps(game_state))
                    await self.send_to_group("state_update", game_state)
                    await asyncio.sleep(0.5)  # Delay para garantir que o UI mostre o placar atualizado
                    await self.finalize_match_by_points()
                    break

                await asyncio.sleep(1 / 60)  # 60 FPS

        except Exception as e:
            print(f"Erro no game loop: {e}")
            await self.close()

    async def finalize_match_by_points(self):
        """
        Finaliza a partida quando um dos jogadores alcança 5 pontos.
        Atualiza o banco de dados, envia mensagem final para os clientes (com instruções para exibir um botão OK para sair)
        e remove o estado do jogo do Redis.
        """
        game_state = json.loads(self.redis.get(self.match_id))
        
        # Determina o lado vencedor com base na pontuação
        if game_state["scores"]["left"] >= 5:
            winner_side = "left"
            loser_side = "right"
        else:
            winner_side = "right"
            loser_side = "left"
        
        # Obtém os IDs dos jogadores
        winner_id = None
        loser_id = None
        for uid, side in game_state["players"].items():
            if side == winner_side:
                winner_id = uid
            elif side == loser_side:
                loser_id = uid

        # Envia mensagem final para os clientes (ex: para exibir alerta com botão OK)
        await self.send_to_group("match_finished", {
            "message": "Partida finalizada por pontuação.",
            "redirect_url": "/chat/",
            "winner": winner_id,
            "loser": loser_id,
            "final_alert": "Partida finalizada! Clique em OK para sair da partida."
        })

        # Atualiza o match e os contadores de vitórias/derrotas
        await sync_to_async(self.update_match_by_points)(winner_id, loser_id, game_state["scores"])
        
        # Remove o estado do jogo do Redis
        self.redis.delete(self.match_id)

    
    def update_match_by_points(self, winner_id, loser_id, scores):
        """
        Atualiza a partida no banco de dados:
        - Salva os scores finais (incluindo o quinto ponto);
        - Define o winner_id com o id do jogador vencedor;
        - Marca a partida como 'completed' e atualiza os timestamps;
        - Incrementa +1 no campo wins do vencedor e +1 no campo losses do perdedor.
        """
        try:
            match = GameMatch.objects.get(pk=self.match_id)
            match.score_player1 = scores["left"]
            match.score_player2 = scores["right"]
            # Define o vencedor na coluna winner_id
            if str(match.player1_id) == str(winner_id):
                match.winner_id = match.player1_id
            else:
                match.winner_id = match.player2_id
            match.status = "completed"
            from django.utils import timezone
            match.last_updated = timezone.now()
            match.played_at = timezone.now()
            match.save()
            print(f"Partida {self.match_id} finalizada por pontos. Vencedor: {winner_id}.")

            # Agora atualiza os contadores de vitórias e derrotas
            from django.contrib.auth import get_user_model
            User = get_user_model()
            winner = User.objects.get(pk=winner_id)
            loser = User.objects.get(pk=loser_id)
            # Se os campos wins/losses estiverem como None, tratamos como 0
            winner.wins = (winner.wins or 0) + 1
            loser.losses = (loser.losses or 0) + 1
            winner.save()
            loser.save()
            print(f"Atualizados: Winner (ID: {winner_id}) wins={winner.wins}; Loser (ID: {loser_id}) losses={loser.losses}")
        except Exception as e:
            print(f"Erro ao atualizar partida por pontos: {e}")

    
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
