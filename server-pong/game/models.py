from django.db import models
from django.conf import settings

class Tournament(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(
        max_length=50,
        choices=[
            ('planned', 'Planned'),
            ('ongoing', 'Ongoing'),
            ('completed', 'Completed')
        ],
        default='planned'
    )
    winner = models.ForeignKey(
        'user_management.User',  # Referencia a tabela de usuários
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tournaments_won"
    )
    created_by = models.ForeignKey(
        'user_management.User',
        on_delete=models.CASCADE,
        related_name="tournaments_created"
    )

    def __str__(self):
        return f"{self.name} (Created by: {self.created_by.display_name})"

class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name="participants"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tournament_participations"
    )
    alias = models.CharField(max_length=255)
    points = models.IntegerField(default=0)
    registered_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=50,
        choices=[
            ('pending', 'Pending'),
            ('confirmed', 'Confirmed')
        ],
        default='pending'
    )
    abandoned = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['tournament', 'user'], name='unique_participant_per_tournament')
        ]

    def __str__(self):
        return f"{self.alias} ({self.user.username}) in {self.tournament.name} - {self.points} pts"

class Match(models.Model):
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name="matches"
    )
    player1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="matches_as_player1"
    )
    player2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="matches_as_player2"
    )
    score_player1 = models.IntegerField(null=True, blank=True)  # Aceita valores nulos
    score_player2 = models.IntegerField(null=True, blank=True)  # Aceita valores nulos
    status = models.CharField(
        max_length=50,
        choices=[
            ('pending', 'Pending'),
            ('ongoing', 'Ongoing'),
            ('paused', 'Paused'),
            ('completed', 'Completed'),
            ('disconnected', 'Disconnected')
        ],
        default='pending'
    )
    is_winner_by_wo = models.BooleanField(default=False)
    played_at = models.DateTimeField(null=True, blank=True)  # Aceita valores nulos
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tournament Match {self.id}: {self.player1.username} vs {self.player2.username}"

class MatchStatus(models.Model):
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name="statuses"
    )
    event_type = models.CharField(
        max_length=50,
        choices=[
            ('ready', 'Ready'),
            ('disconnect', 'Disconnect'),
            ('reconnect', 'Reconnect'),
            ('lag', 'Lag')
        ]
    )
    player = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="match_statuses"
    )
    description = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} in Match {self.match.id} by {self.player.username if self.player else 'Unknown'}"

class Notification(models.Model):
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    player = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    message = models.CharField(max_length=255)
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.player.username} in Match {self.match.id}"
