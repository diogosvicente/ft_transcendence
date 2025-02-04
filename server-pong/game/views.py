from django.db import models, IntegrityError, transaction
from django.db.models import Count, Q, F
from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Match, Tournament, TournamentParticipant
from .serializers import (
    TournamentSerializer,
    TournamentParticipantSerializer,
    MatchSerializer
)

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync, sync_to_async

class PositionAtRankingToUserProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        User = get_user_model()  # Obtenha o modelo de usuário configurado

        # Calcule o número de torneios vencidos por cada usuário
        ranking = User.objects.annotate(
            total_tournaments_won=Count('tournaments_created', filter=Q(tournaments_created__winner_id=F('id')))
        ).order_by('-total_tournaments_won')

        # Prepare a resposta
        data = [
            {
                "id": user.id,
                "name": user.email,  # Substituído por email
                "tournaments_won": user.total_tournaments_won,
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
            
            # Determina o resultado com verificações para None
            if match.score_player1 is not None and match.score_player2 is not None:
                if (match.player1 == user and match.score_player1 > match.score_player2) or \
                   (match.player2 == user and match.score_player2 > match.score_player1):
                    result = "Vitória"
                else:
                    result = "Derrota"
            else:
                result = "Não definido"

            match_history.append({
                "id": match.id,
                "date": match.played_at,
                "opponent_display_name": opponent.display_name,
                "opponent_alias": getattr(opponent, "alias", None),
                "result": result,
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

            # Serializar o torneio completo
            serialized_tournament = TournamentSerializer(tournament, context={"request": request}).data

            return Response(
                {"message": "Torneio criado com sucesso.", "tournament": serialized_tournament},
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

            # Incrementa o número total de participantes
            tournament.total_participants = TournamentParticipant.objects.filter(tournament=tournament).count()
            tournament.save()

            # Envia mensagem de atualização via WebSocket
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "tournaments",
                {
                    "type": "tournament_update_message",
                    "tournament": {
                        "id": tournament.id,
                        "name": tournament.name,
                        "total_participants": tournament.total_participants,
                        "status": tournament.status,
                        "creator_id": tournament.created_by.id,
                        "creator_display_name": tournament.created_by.display_name,
                    },
                },
            )

            # Retorna os dados atualizados do torneio
            return Response(
                {
                    "tournament": {
                        "id": tournament.id,
                        "name": tournament.name,
                        "total_participants": tournament.total_participants,
                        "status": tournament.status,
                        "creator_id": tournament.created_by.id,
                        "creator_display_name": tournament.created_by.display_name,
                        "user_registered": True,
                        "user_alias": alias,
                    }
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TournamentStartAPIView(APIView):
    """
    Permite que o criador do torneio inicie o torneio, mudando o status para "ongoing".
    Também registra todas as partidas no esquema de pontos corridos e inicia automaticamente a primeira partida.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            tournament = Tournament.objects.get(pk=pk)
        except Tournament.DoesNotExist:
            return Response({"error": "Torneio não encontrado."}, status=404)

        # Verifica se o usuário é o criador do torneio
        if tournament.created_by != request.user:
            return Response({"error": "Apenas o criador do torneio pode iniciá-lo."}, status=403)

        if tournament.status != "planned":
            return Response({"error": "O torneio já foi iniciado ou está concluído."}, status=400)

        participants = TournamentParticipant.objects.filter(tournament=tournament)
        participant_count = participants.count()
        if participant_count < 3:
            return Response({"error": "O torneio precisa de pelo menos 3 participantes para ser iniciado."}, status=400)

        # Atualiza o status do torneio para "ongoing"
        tournament.status = "ongoing"
        tournament.save()

        # Atualiza o status dos participantes para "confirmed"
        for participant in participants:
            participant.status = "confirmed"
            participant.save()

        # Cria as partidas (round-robin)
        matches = []
        participant_list = list(participants)
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
                        last_updated=timezone.now(),
                        player1_id=player1.user.id,
                        player2_id=player2.user.id,
                        tournament_id=tournament.id,
                        is_winner_by_wo=False,
                    )
                )
        Match.objects.bulk_create(matches)

        # Notifica a todos os usuários conectados à área de torneios sobre a atualização
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "tournaments",
            {
                "type": "tournament_update_message",
                "tournament": {
                    "id": tournament.id,
                    "name": tournament.name,
                    "total_participants": participant_count,
                    "status": "ongoing",
                    "message": f"O torneio '{tournament.name}' foi iniciado!",
                },
            },
        )

        return Response(
            {
                "message": "Torneio iniciado com sucesso.",
                "status": tournament.status,
                "matches_created": len(matches),
            },
            status=200,
        )

class TournamentSetWinnerAPIView(APIView):
    """
    Define o vencedor de um torneio com base no participant_id (user_id).
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            # Busca o torneio
            tournament = Tournament.objects.get(pk=pk)
        except Tournament.DoesNotExist:
            return Response({"error": "Torneio não encontrado."}, status=404)

        # Obtém o participant_id do corpo da requisição
        participant_user_id = request.data.get("participant_id")
        if not participant_user_id:
            return Response({"error": "participant_id é obrigatório."}, status=400)

        try:
            # Verifica se o user_id está na tabela game_tournamentparticipant e pertence ao torneio
            participant = TournamentParticipant.objects.get(
                user_id=participant_user_id,
                tournament_id=tournament.id  # Garantindo que pertence ao torneio
            )
        except TournamentParticipant.DoesNotExist:
            return Response(
                {"error": "O participante especificado não pertence a este torneio."},
                status=400,
            )

        # Define o vencedor do torneio
        tournament.winner_id = participant.user_id  # Atualiza com o user_id
        tournament.save()

        return Response(
            {
                "message": "Vencedor definido com sucesso.",
                "tournament_id": tournament.id,
                "winner_id": participant.user_id,  # ID do usuário (vencedor)
                "winner_alias": participant.alias,  # Alias do vencedor
            },
            status=200,
        )

class ChallengeUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        opponent_id = request.data.get("opponent_id")

        if not opponent_id:
            return Response({"error": "O ID do oponente é obrigatório."}, status=400)

        try:
            opponent = get_user_model().objects.get(id=opponent_id)
        except get_user_model().DoesNotExist:
            return Response({"error": "O oponente não foi encontrado."}, status=404)

        # Verifica se os jogadores são diferentes
        if user.id == opponent.id:
            return Response({"error": "Você não pode desafiar a si mesmo."}, status=400)

        # Cria a partida
        match = Match.objects.create(
            player1=user,
            player2=opponent,
            status="pending",
            tournament_id=None  # Torneio é nulo para desafios diretos
        )

        # Envia notificação via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{opponent.id}",  # Grupo do WebSocket do oponente
            {
                "type": "game_challenge",
                "message": f"{user.display_name} desafiou você para uma partida!",
                "match_id": match.id,
                "sender_id": user.id,
            },
        )

        return Response(
            {
                "message": "Desafio enviado com sucesso.",
                "match_id": match.id,
                "status": match.status,
            },
            status=201,
        )

class AcceptChallengeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        match_id = request.data.get("match_id")

        if not match_id:
            return Response({"error": "O ID da partida é obrigatório."}, status=400)

        try:
            match = Match.objects.get(id=match_id, player2=user, status="pending")
        except Match.DoesNotExist:
            return Response({"error": "Partida não encontrada ou já iniciada."}, status=404)

        # Atualiza o status da partida para "ongoing"
        match.status = "ongoing"
        match.save()

        # Notifica ambos os jogadores para se conectarem ao WebSocket do jogo
        channel_layer = get_channel_layer()
        for player_id in [match.player1.id, match.player2.id]:
            async_to_sync(channel_layer.group_send)(
                f"user_{player_id}",
                {
                    "type": "game_start",
                    "message": "A partida foi aceita. Conecte-se ao jogo!",
                    "match_id": match.id,
                },
            )

        return Response(
            {"message": "Partida aceita. Conecte-se ao jogo.", "match_id": match.id},
            status=200,
        )

class DeclineChallengeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        match_id = request.data.get("match_id")

        if not match_id:
            return Response({"error": "O ID da partida é obrigatório."}, status=400)

        try:
            match = Match.objects.get(id=match_id, player2=user, status="pending")
        except Match.DoesNotExist:
            return Response({"error": "Partida não encontrada ou já iniciada."}, status=404)

        # Notifica o desafiante que o desafio foi recusado
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{match.player1.id}",
            {
                "type": "game_challenge_declined",
                "message": f"{user.display_name} recusou o seu desafio.",
                "match_id": match.id,
            },
        )

        # Remove a partida
        match.delete()

        return Response({"message": "Desafio recusado."}, status=200)

class MatchDetailView(APIView):
    """
    Retorna os detalhes de uma partida específica.
    """
    permission_classes = [IsAuthenticated]  # Apenas usuários autenticados podem acessar

    def get(self, request, id):
        try:
            # Busca a partida
            match = Match.objects.get(id=id)
            
            # Verifica se o usuário logado é participante da partida
            if request.user != match.player1 and request.user != match.player2:
                return Response({"detail": "Você não tem permissão para acessar esta partida."}, status=status.HTTP_403_FORBIDDEN)

            # Serializa os dados da partida
            serializer = MatchSerializer(match)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Match.DoesNotExist:
            return Response({"detail": "Partida não encontrada."}, status=status.HTTP_404_NOT_FOUND)
    """
    Retorna os detalhes de uma partida específica.
    """
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    lookup_field = 'id'
    permission_classes = [IsAuthenticated]  # Apenas usuários autenticados podem acessar

    def get_queryset(self):
        """
        Filtra as partidas para garantir que apenas os participantes possam acessar.
        """
        user = self.request.user
        return Match.objects.filter(player1=user) | Match.objects.filter(player2=user)

class MatchFinalizeAPIView(APIView):
    """
    Finaliza a partida seja por WalkOver (WO) ou por atingimento da pontuação final.
    
    Parâmetros esperados:
      - finalization_type: "walkover" ou "points"
    
    Se for "walkover", o usuário autenticado que chamar esta endpoint será considerado vencedor.
    Se for "points", a partida será finalizada comparando os scores:
      - Se score_player1 > score_player2, o vencedor é player1;
      - Se score_player2 > score_player1, o vencedor é player2.
    
    Após a finalização, o campo winner_id é atualizado e os contadores de vitórias (wins) e derrotas (losses)
    dos usuários envolvidos são incrementados.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            match = Match.objects.get(pk=pk)
        except Match.DoesNotExist:
            return Response({"error": "Partida não encontrada."}, status=404)

        if request.user != match.player1 and request.user != match.player2:
            return Response({"error": "Você não participa desta partida."}, status=403)

        finalization_type = request.data.get("finalization_type", "points")
        winner_id = None

        if finalization_type == "walkover":
            if request.user == match.player1:
                match.score_player1 = 1
                match.score_player2 = 0
                winner_id = match.player1.id
            else:
                match.score_player1 = 0
                match.score_player2 = 1
                winner_id = match.player2.id
            match.is_winner_by_wo = True

        elif finalization_type == "points":
            threshold = 5
            if match.score_player1 >= threshold or match.score_player2 >= threshold:
                if match.score_player1 > match.score_player2:
                    winner_id = match.player1.id
                elif match.score_player2 > match.score_player1:
                    winner_id = match.player2.id
                else:
                    return Response({"error": "Empate não pode ser finalizado."}, status=400)
            else:
                return Response({"error": "Pontuação insuficiente para finalizar a partida."}, status=400)
        else:
            return Response({"error": "finalization_type inválido."}, status=400)

        # Define o winner_id para ambos os casos (por WO ou por pontos)
        try:
            with transaction.atomic():
                match.winner_id = winner_id
                match.status = "completed"
                match.last_updated = timezone.now()
                match.played_at = timezone.now()
                match.save()

                if winner_id == match.player1.id:
                    loser_id = match.player2.id
                else:
                    loser_id = match.player1.id

                User = get_user_model()
                winner = User.objects.get(pk=winner_id)
                loser = User.objects.get(pk=loser_id)
                winner.wins = (winner.wins or 0) + 1
                loser.losses = (loser.losses or 0) + 1
                winner.save()
                loser.save()
        except Exception as e:
            return Response({"error": f"Erro ao atualizar estatísticas: {e}"}, status=500)

        return Response({
            "message": "Partida finalizada.",
            "match_id": match.id,
            "winner_id": winner_id,
            "finalization_type": finalization_type
        }, status=200)

class OngoingMatchAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Procura partidas onde o usuário é player1 ou player2 e o status é "ongoing",
        # ordenando por id decrescente para pegar a última registrada.
        match = Match.objects.filter(
            Q(player1=user) | Q(player2=user),
            status="ongoing"
        ).order_by('-id').first()
        if match:
            serializer = MatchSerializer(match)
            return Response(serializer.data)
        return Response({"detail": "Nenhuma partida em andamento."}, status=404)

class TournamentMatchesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # Verifica se o torneio existe
        tournament = get_object_or_404(Tournament, pk=pk)
        # Recupera todas as partidas associadas ao torneio
        matches = Match.objects.filter(tournament_id=tournament.id).order_by('id')
        # Aqui você pode usar um serializer para formatar os dados, por exemplo:
        # serializer = MatchSerializer(matches, many=True)
        # return Response(serializer.data)
        # Para simplificar, vamos montar uma resposta simples:
        match_list = []
        for match in matches:
            match_list.append({
                "id": match.id,
                "player1_id": match.player1_id,
                "player2_id": match.player2_id,
                "score_player1": match.score_player1,
                "score_player2": match.score_player2,
                "status": match.status,
                "played_at": match.played_at,
            })
        return Response(match_list)