from django.urls import path
from .views import (
    UserRegistrationView,
    LoginView,
    LogoutView,
    GetUserInfo,
    Validate2FACodeView,
    ExcludeSelfAndFriendsUserListView,
    GetTokenView,
    UserProfileView,
    MatchHistoryView,
    UserRelationshipView,
    VictoryRankingAPIView
)

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('logout/', LogoutView.as_view(), name='user-logout'),
    path('user-info/<int:user_id>/', GetUserInfo.as_view(), name='user-info'),
    path('2fa/validate/', Validate2FACodeView.as_view(), name='validate-2fa-code'),
    path('exclude-self/', ExcludeSelfAndFriendsUserListView.as_view(), name='exclude_self_and_friends'),
    path("get-token/", GetTokenView.as_view(), name="get-token"),
    path("user-profile/<int:user_id>/", UserProfileView.as_view(), name="user-profile"),
    path("match-history/<int:user_id>/", MatchHistoryView.as_view(), name="match-history"),
    path("relationship/<int:user_id>/", UserRelationshipView.as_view(), name="user-relationship"),
    path("ranking/victories/", VictoryRankingAPIView.as_view(), name="victory-ranking"),
]
