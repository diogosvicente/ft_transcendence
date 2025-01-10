from django.urls import path
from .views import (
    PositionAtRankingToUserProfile,
    MatchHistoryAPIView,
    TournamentRankingAPIView,  # Importe a nova view
)

urlpatterns = [
    path('ranking/', PositionAtRankingToUserProfile.as_view(), name='ranking'),    
    path('match-history/<int:user_id>/', MatchHistoryAPIView.as_view(), name='match-history'),
    path('ranking/tournaments/', TournamentRankingAPIView.as_view(), name='tournament-ranking'),
]
