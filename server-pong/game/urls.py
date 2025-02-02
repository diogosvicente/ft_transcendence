from django.urls import path
from .views import (
    PositionAtRankingToUserProfile,
    MatchHistoryAPIView,
    TournamentRankingAPIView,
    TournamentListAPIView,
    TournamentDetailAPIView,
    TournamentCreateAPIView,
    TournamentRegisterAPIView,
    TournamentStartAPIView,
    TournamentSetWinnerAPIView,
    ChallengeUserAPIView,
    AcceptChallengeAPIView,
    DeclineChallengeAPIView,
    MatchDetailView,
    MatchFinalizeAPIView
)

urlpatterns = [
    # Rankings e histórico de partidas
    path('ranking/', PositionAtRankingToUserProfile.as_view(), name='ranking'),
    path('match-history/<int:user_id>/', MatchHistoryAPIView.as_view(), name='match-history'),
    path('ranking/tournaments/', TournamentRankingAPIView.as_view(), name='tournament-ranking'),

    # Endpoints relacionados a torneios
    path('tournaments/', TournamentListAPIView.as_view(), name='tournament-list'),
    path('tournaments/<int:pk>/', TournamentDetailAPIView.as_view(), name='tournament-detail-with-matches'),
    path('tournaments/create/', TournamentCreateAPIView.as_view(), name='tournament-create'),
    path('tournaments/<int:pk>/register/', TournamentRegisterAPIView.as_view(), name='tournament-register'),
    path("tournaments/<int:pk>/start/", TournamentStartAPIView.as_view(), name="tournament-start"),
    path('tournaments/<int:pk>/set-winner/', TournamentSetWinnerAPIView.as_view(), name='set-tournament-winner'),

    # Endpoints de desafio
    path('challenge-user/', ChallengeUserAPIView.as_view(), name='challenge_user'),
    path('accept-challenge/', AcceptChallengeAPIView.as_view(), name='accept_challenge'),
    path("decline-challenge/", DeclineChallengeAPIView.as_view(), name="decline-challenge"),

    # Detalhes e finalização de partidas
    path('match/<int:id>/', MatchDetailView.as_view(), name='match-detail'),
    path('match/<int:pk>/walkover/', MatchFinalizeAPIView.as_view(), name='match-walkover'),
]
