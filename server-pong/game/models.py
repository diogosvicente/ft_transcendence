from django.db import models
from django.conf import settings


class Tournament(models.Model):
    name = models.CharField(max_length=255)  # Nome do torneio
    created_at = models.DateTimeField(auto_now_add=True)  # Data de criação
    updated_at = models.DateTimeField(auto_now=True)  # Última atualização
    status = models.CharField(
        max_length=50,
        choices=[
            ('planned', 'Planned'),  # Torneio planejado
            ('ongoing', 'Ongoing'),  # Torneio em andamento
            ('completed', 'Completed')  # Torneio finalizado
        ],
        default='planned'
    )  # Status do torneio
    winner = models.ForeignKey(
        'TournamentParticipant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tournaments_won"
    )  # Jogador vencedor (opcional)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tournaments_created"
    )  # Usuário que criou o torneio

    def __str__(self):
        return f"{self.name} (Created by: {self.created_by.username})"


class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name="participants"
    )  # Torneio associado
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tournament_participations"
    )  # Jogador associado
    alias = models.CharField(max_length=255)  # Apelido do jogador no torneio
    points = models.IntegerField(default=0)  # Pontos acumulados no torneio
    registered_at = models.DateTimeField(auto_now_add=True)  # Data de inscrição
    status = models.CharField(
        max_length=50,
        choices=[
            ('pending', 'Pending'),  # Inscrição pendente
            ('confirmed', 'Confirmed')  # Jogador confirmado no torneio
        ],
        default='pending'
    )  # Status da inscrição
    abandoned = models.BooleanField(default=False)  # Indica se o jogador abandonou o torneio

    class Meta:
        unique_together = ('tournament', 'user')  # Garante uma única inscrição por torneio

    def __str__(self):
        return f"{self.alias} ({self.user.username}) in {self.tournament.name} - {self.points} pts"


class Match(models.Model):
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="matches"
    )  # Torneio associado (pode ser nulo para partidas casuais)
    player1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="matches_as_player1"
    )  # Primeiro jogador
    player2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="matches_as_player2"
    )  # Segundo jogador
    score_player1 = models.IntegerField(default=0)  # Pontuação do jogador 1
    score_player2 = models.IntegerField(default=0)  # Pontuação do jogador 2
    status = models.CharField(
        max_length=50,
        choices=[
            ('pending', 'Pending'),  # Partida pendente
            ('ongoing', 'Ongoing'),  # Partida em andamento
            ('paused', 'Paused'),  # Partida pausada
            ('completed', 'Completed'),  # Partida concluída
            ('disconnected', 'Disconnected')  # Jogador desconectado
        ],
        default='pending'
    )  # Status da partida
    is_winner_by_wo = models.BooleanField(default=False)  # Indica se a vitória foi por W.O.
    played_at = models.DateTimeField(blank=True, null=True)  # Data e hora da partida
    last_updated = models.DateTimeField(auto_now=True)  # Última atualização

    def __str__(self):
        if self.tournament:
            return f"Tournament Match {self.id}: {self.player1.username} vs {self.player2.username}"
        return f"Casual Match {self.id}: {self.player1.username} vs {self.player2.username}"


class MatchStatus(models.Model):
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name="statuses"
    )  # Partida associada
    event_type = models.CharField(
        max_length=50,
        choices=[
            ('ready', 'Ready'),  # Jogador está pronto
            ('disconnect', 'Disconnect'),  # Jogador desconectou
            ('reconnect', 'Reconnect'),  # Jogador reconectou
            ('lag', 'Lag'),  # Problemas de latência
        ]
    )  # Tipo de evento
    player = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="match_statuses"
    )  # Jogador associado ao evento
    description = models.TextField(blank=True, null=True)  # Detalhes do evento (opcional)
    timestamp = models.DateTimeField(auto_now_add=True)  # Data e hora do evento

    def __str__(self):
        return f"{self.event_type} in Match {self.match.id} by {self.player.username if self.player else 'Unknown'}"


class Notification(models.Model):
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name="notifications"
    )  # Partida associada
    player = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )  # Jogador associado
    message = models.CharField(max_length=255)  # Mensagem da notificação
    sent_at = models.DateTimeField(auto_now_add=True)  # Data e hora do envio da notificação
    is_read = models.BooleanField(default=False)  # Indica se a notificação foi lida

    def __str__(self):
        return f"Notification for {self.player.username} in Match {self.match.id}"
