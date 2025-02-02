from rest_framework import serializers
from user_management.models import User
from .models import Tournament, TournamentParticipant, Match

class TournamentSerializer(serializers.ModelSerializer):
    created_by_display = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = ['id', 'name', 'created_at', 'updated_at', 'status', 'winner', 'created_by', 'created_by_display']

    def get_created_by_display(self, obj):
        if obj.created_by:
            participant = TournamentParticipant.objects.filter(tournament=obj, user=obj.created_by).first()
            alias = participant.alias if participant else "Desconhecido"
            return f"{obj.created_by.display_name} as {alias}"
        return "Desconhecido"

class TournamentParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = TournamentParticipant
        fields = '__all__'

class MatchSerializer(serializers.ModelSerializer):
    player1_display = serializers.SerializerMethodField()
    player2_display = serializers.SerializerMethodField()
    player1_avatar = serializers.SerializerMethodField()
    player2_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            'id',
            'player1_id',
            'player1_display',
            'player1_avatar',
            'player2_id',
            'player2_display',
            'player2_avatar',
            'tournament_id',
            'score_player1',
            'score_player2',
            'status',
            'played_at',
            'last_updated',
            'is_winner_by_wo',
            'winner_id',  # Novo campo adicionado
        ]

    def get_player1_display(self, obj):
        player1_user = obj.player1
        player1_participant = TournamentParticipant.objects.filter(
            user=player1_user,
            tournament=obj.tournament
        ).first()
        if player1_user and player1_participant:
            return f"{player1_user.display_name} as {player1_participant.alias}"
        elif player1_user:
            return player1_user.display_name
        return "Desconhecido"

    def get_player2_display(self, obj):
        player2_user = obj.player2
        player2_participant = TournamentParticipant.objects.filter(
            user=player2_user,
            tournament=obj.tournament
        ).first()
        if player2_user and player2_participant:
            return f"{player2_user.display_name} as {player2_participant.alias}"
        elif player2_user:
            return player2_user.display_name
        return "Desconhecido"

    def get_player1_avatar(self, obj):
        if obj.player1:
            return obj.player1.avatar.url if obj.player1.avatar else None
        return None

    def get_player2_avatar(self, obj):
        if obj.player2:
            return obj.player2.avatar.url if obj.player2.avatar else None
        return None
