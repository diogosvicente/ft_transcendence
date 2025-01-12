from django.db import models, IntegrityError
from django.db.models import Count, Q, F
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Match, Tournament, TournamentParticipant
from .serializers import TournamentSerializer, MatchSerializer, TournamentParticipantSerializer
from django.utils.timezone import now

class PositionAtRankingToUserProfile(APIView):
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

class TournamentRankingAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        User = get_user_model()

        # Agrupa por winner_id e conta o número de torneios vencidos por cada usuário
        winners = (
            Tournament.objects.values('winner_id')
            .annotate(tournaments_won=Count('id'))  # Conta o número de torneios vencidos
            .filter(winner_id__isnull=False)  # Ignora torneios sem vencedor
            .order_by('-tournaments_won')  # Ordena pelo número de vitórias
        )

        # Busca os detalhes do usuário baseado no winner_id
        user_data = []
        for index, winner in enumerate(winners):
            try:
                user = User.objects.get(id=winner['winner_id'])
                user_data.append({
                    "id": user.id,
                    "display_name": user.display_name or user.email,  # Mostra o display_name ou email como fallback
                    "avatar": user.avatar.url if user.avatar else None,
                    "tournaments_won": winner['tournaments_won'],  # Total de torneios vencidos
                    "position": index + 1  # Posição no ranking
                })
            except User.DoesNotExist:
                # Caso o usuário associado ao winner_id não exista, pule
                continue

        return Response(user_data)

class TournamentListAPIView(APIView):
    """
    Lista todos os torneios disponíveis, verifica se o usuário está inscrito e retorna o alias do usuário logado e a quantidade de inscritos.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        User = get_user_model()
        user = request.user  # Usuário logado

        tournaments = Tournament.objects.all().order_by("-created_at")
        tournament_list = []

        for tournament in tournaments:
            # Verifica se o usuário está registrado no torneio
            participant = TournamentParticipant.objects.filter(
                tournament=tournament, user=user
            ).first()
            user_registered = participant is not None
            user_alias = participant.alias if participant else None

            # Obter alias do criador
            creator = User.objects.get(id=tournament.created_by_id)
            creator_participant = TournamentParticipant.objects.filter(
                tournament=tournament, user=creator
            ).first()
            creator_alias = creator_participant.alias if creator_participant else "Sem Alias"

            # Quantidade de inscritos no torneio
            total_participants = TournamentParticipant.objects.filter(
                tournament=tournament
            ).count()

            tournament_list.append({
                "id": tournament.id,
                "name": tournament.name,
                "created_at": tournament.created_at.strftime("%d/%m/%Y"),
                "status": tournament.status,
                "creator_display_name": creator.display_name,
                "creator_alias": creator_alias,
                "creator_id": tournament.created_by_id,
                "user_registered": user_registered,
                "user_alias": user_alias,  # Alias do usuário logado
                "total_participants": total_participants,  # Quantidade de inscritos
            })

        return Response(tournament_list)

class TournamentDetailAPIView(APIView):
    """
    Exibe detalhes de um torneio específico, incluindo participantes e partidas.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            tournament = Tournament.objects.get(pk=pk)
        except Tournament.DoesNotExist:
            return Response({"error": "Torneio não encontrado."}, status=404)

        # Serializa os detalhes do torneio
        tournament_serializer = TournamentSerializer(tournament)

        # Busca os participantes do torneio e inclui o display_name do usuário
        participants = TournamentParticipant.objects.filter(tournament=tournament).select_related("user")
        participant_data = []
        for participant in participants:
            participant_data.append({
                "id": participant.id,
                "alias": participant.alias,
                "points": participant.points,
                "registered_at": participant.registered_at,
                "status": participant.status,
                "user": {
                    "id": participant.user.id,
                    "display_name": participant.user.display_name  # Certifique-se de que o campo existe no modelo User
                }
            })

        # Busca as partidas do torneio
        matches = Match.objects.filter(tournament=tournament).select_related("player1", "player2")
        match_data = []
        for match in matches:
            match_data.append({
                "id": match.id,
                "played_at": match.played_at,
                "score_player1": match.score_player1,
                "score_player2": match.score_player2,
                "status": match.status,
                "player1_display": match.player1.display_name,
                "player1_alias": TournamentParticipant.objects.filter(
                    tournament=tournament, user=match.player1
                ).first().alias if TournamentParticipant.objects.filter(
                    tournament=tournament, user=match.player1
                ).exists() else "Desconhecido",
                "player2_display": match.player2.display_name,
                "player2_alias": TournamentParticipant.objects.filter(
                    tournament=tournament, user=match.player2
                ).first().alias if TournamentParticipant.objects.filter(
                    tournament=tournament, user=match.player2
                ).exists() else "Desconhecido",
            })

        # Combina os dados em uma única resposta
        data = {
            "tournament": tournament_serializer.data,
            "participants": participant_data,
            "matches": match_data,
        }
        return Response(data)

class TournamentCreateAPIView(APIView):
    """
    Permite que um usuário crie um novo torneio.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        name = request.data.get("name")
        alias = request.data.get("alias")

        # Verificação de campos obrigatórios
        if not name or not alias:
            return Response({"error": "Nome do torneio e alias são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        # Verificação de nome único do torneio
        if Tournament.objects.filter(name=name).exists():
            return Response({"error": "Já existe um torneio com este nome."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Criar o torneio
            tournament = Tournament.objects.create(name=name, created_by=user)

            # Adicionar o criador como participante
            TournamentParticipant.objects.create(
                alias=alias,
                tournament=tournament,
                user=user,
                points=0,
                status="confirmed",
                abandoned=False
            )

            return Response(
                {"message": "Torneio criado com sucesso.", "tournament": {"id": tournament.id, "name": tournament.name}},
                status=status.HTTP_201_CREATED
            )

        except IntegrityError as e:
            # Logar erros de integridade no banco de dados
            print(f"Erro de integridade ao criar torneio: {e}")
            return Response({"error": "Erro ao salvar os dados no banco de dados."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            # Logar outros erros
            print(f"Erro inesperado ao criar torneio: {e}")
            return Response({"error": "Erro interno no servidor."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TournamentRegisterAPIView(APIView):
    """
    Permite que um usuário se registre em um torneio.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            tournament = Tournament.objects.get(pk=pk)
        except Tournament.DoesNotExist:
            return Response({"error": "Torneio não encontrado."}, status=404)

        if tournament.status != "planned":
            return Response({"error": "As inscrições estão fechadas para este torneio."}, status=400)

        # Verifica se o usuário já está inscrito
        if TournamentParticipant.objects.filter(tournament=tournament, user=request.user).exists():
            return Response({"error": "Você já está inscrito neste torneio."}, status=400)

        alias = request.data.get("alias")
        if not alias:
            return Response({"error": "O campo 'alias' é obrigatório para se inscrever."}, status=400)

        # Verifica se o alias já está em uso no torneio
        if TournamentParticipant.objects.filter(tournament=tournament, alias=alias).exists():
            return Response({"error": "Este alias já está em uso neste torneio."}, status=400)

        data = {
            "tournament": tournament.id,
            "user": request.user.id,
            "alias": alias,
        }
        serializer = TournamentParticipantSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TournamentStartAPIView(APIView):
    """
    Permite que o criador do torneio inicie o torneio, mudando o status para "ongoing".
    Também registra todas as partidas no esquema de pontos corridos.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            tournament = Tournament.objects.get(pk=pk)
        except Tournament.DoesNotExist:
            return Response({"error": "Torneio não encontrado."}, status=404)

        # Verifica se o usuário é o criador do torneio
        if tournament.created_by != request.user:
            return Response(
                {"error": "Apenas o criador do torneio pode iniciá-lo."},
                status=403,
            )

        # Verifica se o status atual é "planned"
        if tournament.status != "planned":
            return Response(
                {"error": "O torneio já foi iniciado ou está concluído."},
                status=400,
            )

        # Verifica se há pelo menos 3 participantes
        participants = TournamentParticipant.objects.filter(tournament=tournament)
        participant_count = participants.count()
        if participant_count < 3:
            return Response(
                {"error": "O torneio precisa de pelo menos 3 participantes para ser iniciado."},
                status=400,
            )

        # Atualiza o status do torneio para "ongoing"
        tournament.status = "ongoing"
        tournament.save()

        # Atualiza o status dos participantes para "confirmed"
        participants.update(status="confirmed")

        # Registra as partidas no esquema de pontos corridos
        matches = []
        participant_list = list(participants)  # Converte o queryset em uma lista para iteração
        for i in range(participant_count):
            for j in range(i + 1, participant_count):
                player1 = participant_list[i]
                player2 = participant_list[j]
                matches.append(
                    Match(
                        score_player1=None,
                        score_player2=None,
                        played_at=None,
                        status="pending",
                        last_updated=now(),
                        player1_id=player1.user.id,
                        player2_id=player2.user.id,
                        tournament_id=tournament.id,
                        is_winner_by_wo=False,
                    )
                )

        # Salva todas as partidas em um único batch
        Match.objects.bulk_create(matches)

        return Response(
            {
                "message": "Torneio iniciado com sucesso.",
                "status": tournament.status,
                "matches_created": len(matches),
            },
            status=200,
        )