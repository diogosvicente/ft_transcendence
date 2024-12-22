from django.urls import path
from .views import UserRegistrationView, LoginView, LogoutView, GetAvatarView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('logout/', LogoutView.as_view(), name='user-logout'),
    path('avatar/', GetAvatarView.as_view(), name='user-avatar'),  # Nova rota para o avatar
]

# URLs disponíveis:
# Registro: http://127.0.0.1:8000/api/user-management/register/
# Login: http://127.0.0.1:8000/api/user-management/login/
# Logout: http://127.0.0.1:8000/api/user-management/logout/
# Avatar: http://127.0.0.1:8000/api/user-management/avatar?email=usuario@example.com


