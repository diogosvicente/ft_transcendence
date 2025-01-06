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
    UserRelationshipView
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
]

# URLs disponíveis:
# Registro: http://127.0.0.1:8000/api/user-management/register/
# Login: http://127.0.0.1:8000/api/user-management/login/
# Logout: http://127.0.0.1:8000/api/user-management/logout/
# Avatar: http://127.0.0.1:8000/api/user-management/avatar?email=usuario@example.com
# Validação do 2FA: http://127.0.0.1:8000/api/user-management/2fa/validate/
# Listar Não Amigos: http://127.0.0.1:8000/api/user-management/users/exclude-self/
# Relacionamento: http://127.0.0.1:8000/api/chat/relationship/<user_id>/
