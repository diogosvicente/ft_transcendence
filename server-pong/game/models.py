from django.db import models
from django.conf import settings


class Tournament(models.Model):
    name = models.CharField(max_length=255)  # Nome do torneio
    created_at = models.DateTimeField(auto_now_add=True)  # Data de criação
    updated_at = models.DateTimeField(auto_now=True)  # Última atualização
    status = models.CharField(
        max_length=50,
        choices=[
            ('planned', 'Planned'),
            ('ongoing', 'Ongoing'),
            ('completed', 'Completed'),
        ],
        default='planned'
    )  # Status do torneio
    winner = models.ForeignKey(
        'PlayerAlias',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tournaments_won"
    )  # Jogador vencedor (opcional)

    def __str__(self):
        return self.name


class PlayerAlias(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="player_aliases"
    )  # Usuário associado
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name="player_aliases"
    )  # Torneio associado
    alias = models.CharField(max_length=255)  # Apelido do jogador no torneio
    points = models.IntegerField(default=0)  # Pontos acumulados no torneio

    class Meta:
        unique_together = ('user', 'tournament')  # Evita duplicidade de alias

    def __str__(self):
        return f"{self.alias} ({self.user.email}) - {self.points} pts"


class Match(models.Model):
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="matches"
    )  # Torneio ao qual a partida pertence (null = partida casual 1x1)
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
            ('pending', 'Pending'),
            ('ongoing', 'Ongoing'),
            ('paused', 'Paused'),
            ('completed', 'Completed'),
            ('disconnected', 'Disconnected'),
        ],
        default='pending'
    )  # Status da partida
    played_at = models.DateTimeField(blank=True, null=True)  # Data e hora da partida
    last_updated = models.DateTimeField(auto_now=True)  # Última atualização

    def __str__(self):
        if self.tournament:
            return f"Tournament Match {self.id}: {self.player1.email} vs {self.player2.email}"
        return f"Casual Match {self.id}: {self.player1.email} vs {self.player2.email}"


class MatchStatus(models.Model):
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name="statuses"
    )  # Partida associada
    event_type = models.CharField(
        max_length=50,
        choices=[
            ('disconnect', 'Disconnect'),
            ('reconnect', 'Reconnect'),
            ('lag', 'Lag'),
        ]
    )  # Tipo de evento
    player = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="match_statuses"
    )  # Jogador afetado pelo evento (opcional)
    description = models.TextField(blank=True, null=True)  # Detalhes do evento
    timestamp = models.DateTimeField(auto_now_add=True)  # Data e hora do evento

    def __str__(self):
        return f"{self.event_type} in Match {self.match.id}"
