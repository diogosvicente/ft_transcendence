from django.urls import path
from .views import (
    RankingAPIView,
    MatchHistoryAPIView
)

urlpatterns = [
    path('ranking/', RankingAPIView.as_view(), name='ranking'),
    path('match-history/<int:user_id>/', MatchHistoryAPIView.as_view(), name='match-history'),
]
