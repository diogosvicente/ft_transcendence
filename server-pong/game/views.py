from django.db import models  # Adicione esta linha
from django.db.models import Count, Q, F  # Adicione Count, Q, e F
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Match, Tournament

class RankingAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        User = get_user_model()  # Obtenha o modelo de usuário configurado

        # Calcule o número de torneios vencidos por cada usuário
        ranking = User.objects.annotate(
            tournaments_won=Count('tournaments_created', filter=Q(tournaments_created__winner_id=F('id')))
        ).order_by('-tournaments_won')

        # Prepare a resposta
        data = [
            {
                "id": user.id,
                "name": user.email,  # Substituído por email
                "tournaments_won": user.tournaments_won,
                "position": index + 1
            }
            for index, user in enumerate(ranking)
        ]

        return Response(data)

class MatchHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "Usuário não encontrado."}, status=404)

        matches = Match.objects.filter(
            models.Q(player1=user) | models.Q(player2=user)
        ).select_related("tournament", "player1", "player2")

        match_history = []
        for match in matches:
            opponent = match.player2 if match.player1 == user else match.player1
            match_history.append({
                "id": match.id,
                "date": match.played_at,
                "opponent_display_name": opponent.display_name,  # Use o campo display_name
                "result": "Vitória" if (match.player1 == user and match.score_player1 > match.score_player2) or
                                         (match.player2 == user and match.score_player2 > match.score_player1) else "Derrota",
                "score": {
                    "player1": match.score_player1,
                    "player2": match.score_player2,
                },
                "tournament_name": match.tournament.name if match.tournament else None,
            })

        return Response(match_history)
