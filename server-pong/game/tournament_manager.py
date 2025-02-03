import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import transaction
from django.utils import timezone
from game.models import Tournament, Match, TournamentParticipant

class TournamentManagerConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Suponha que o URL contenha o tournament_id, ex.: /ws/tournament/{tournament_id}/
        self.tournament_id = self.scope["url_route"]["kwargs"]["tournament_id"]
        self.room_group_name = f"tournament_{self.tournament_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"TournamentManager conectado para torneio {self.tournament_id}.")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        print(f"TournamentManager desconectado do torneio {self.tournament_id}.")

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")
        if msg_type == "match_finished":
            # Quando um match acaba, avance para o próximo
            tournament_id = data.get("tournament_id", self.tournament_id)
            await self.advance_tournament(tournament_id)
        # Você pode tratar outros tipos de mensagem se necessário

    async def advance_tournament(self, tournament_id):
        # Função centralizada para avançar para a próxima partida
        channel_layer = get_channel_layer()
        # Bloco atômico para evitar condições de corrida
        from django.db import transaction
        with transaction.atomic():
            tournament = Tournament.objects.select_for_update().get(id=tournament_id)
            pending_matches = Match.objects.filter(tournament_id=tournament_id, status='pending').order_by('id')
            if pending_matches.exists():
                next_match = pending_matches.first()
                next_match.status = 'ongoing'
                next_match.last_updated = timezone.now()
                next_match.save()

                # Envia mensagem de início para o grupo da próxima partida
                async_to_sync(channel_layer.group_send)(
                    f"match_{next_match.id}",
                    {
                        "type": "game_start",
                        "message": "A próxima partida do torneio foi iniciada automaticamente.",
                        "match_id": next_match.id,
                    },
                )
                # Notifica também o grupo global do torneio para atualizar a tabela
                async_to_sync(channel_layer.group_send)(
                    self.room_group_name,
                    {
                        "type": "tournament_update",
                        "tournament": {
                            "id": tournament.id,
                            "name": tournament.name,
                            "status": tournament.status,
                            "next_match_id": next_match.id,
                        },
                    },
                )
                print(f"Iniciando partida {next_match.id} para o torneio {tournament_id}.")
            else:
                # Se não houver partidas pendentes, finaliza o torneio
                tournament.status = 'completed'
                tournament.winner_id = self.determine_tournament_winner(tournament_id)
                tournament.save()
                async_to_sync(channel_layer.group_send)(
                    self.room_group_name,
                    {
                        "type": "tournament_update",
                        "tournament": {
                            "id": tournament.id,
                            "name": tournament.name,
                            "status": "completed",
                            "message": f"O torneio '{tournament.name}' foi finalizado.",
                        },
                    },
                )
                print(f"Torneio {tournament_id} finalizado.")

    def determine_tournament_winner(self, tournament_id):
        participants = TournamentParticipant.objects.filter(tournament_id=tournament_id)
        if participants.exists():
            winner = max(participants, key=lambda p: p.points)
            return winner.user_id
        return None

    async def tournament_update(self, event):
        # Encaminha a atualização para os clientes conectados
        await self.send(json.dumps({
            "type": "tournament_update",
            "tournament": event["tournament"],
        }))
