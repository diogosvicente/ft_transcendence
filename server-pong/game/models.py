from django.db import models
from django.conf import settings


class Tournament(models.Model):
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=100)
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="game_tournaments_won"
    )

    def __str__(self):
        return self.name


class PlayerAlias(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="game_player_aliases"
    )
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name="player_aliases"
    )
    alias = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.alias} ({self.user.email})"


class Match(models.Model):
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="matches"
    )
    player1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="game_matches_as_player1"
    )
    player2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="game_matches_as_player2"
    )
    score_player1 = models.IntegerField(default=0)
    score_player2 = models.IntegerField(default=0)
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="game_matches_won"
    )
    played_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=50,
        choices=[
            ('ongoing', 'Ongoing'),
            ('paused', 'Paused'),
            ('completed', 'Completed'),
            ('disconnected', 'Disconnected')
        ],
        default='ongoing'
    )
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Match {self.id}: {self.player1.email} vs {self.player2.email}"


class MatchStatus(models.Model):
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name="statuses"
    )
    event_type = models.CharField(
        max_length=50,
        choices=[
            ('pause', 'Pause'),
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
        related_name="game_match_statuses"
    )
    description = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} in Match {self.match.id}"
