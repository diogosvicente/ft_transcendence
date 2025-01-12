from rest_framework import serializers
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

    class Meta:
        model = Match
        fields = [
            'id',
            'player1_display',
            'player2_display',
            'score_player1',
            'score_player2',
            'status',
            'played_at',
        ]

    def get_player1_display(self, obj):
        # Obtenha o display_name e o alias do player1
        player1_user = obj.player1
        player1_participant = TournamentParticipant.objects.filter(user=player1_user, tournament=obj.tournament).first()
        if player1_user and player1_participant:
            return f"{player1_user.display_name} as {player1_participant.alias}"
        return "Desconhecido"

    def get_player2_display(self, obj):
        # Obtenha o display_name e o alias do player2
        player2_user = obj.player2
        player2_participant = TournamentParticipant.objects.filter(user=player2_user, tournament=obj.tournament).first()
        if player2_user and player2_participant:
            return f"{player2_user.display_name} as {player2_participant.alias}"
        return "Desconhecido"
