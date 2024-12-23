from django.urls import path
from .views import UserRegistrationView, LoginView, LogoutView, GetAvatarView, Validate2FACodeView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('logout/', LogoutView.as_view(), name='user-logout'),
    path('avatar/', GetAvatarView.as_view(), name='user-avatar'),
    path('2fa/validate/', Validate2FACodeView.as_view(), name='validate-2fa-code'),
]

# URLs disponíveis:
# Registro: http://127.0.0.1:8000/api/user-management/register/
# Login: http://127.0.0.1:8000/api/user-management/login/
# Logout: http://127.0.0.1:8000/api/user-management/logout/
# Avatar: http://127.0.0.1:8000/api/user-management/avatar?email=usuario@example.com
# Validação do 2FA: http://127.0.0.1:8000/api/user-management/2fa/validate/
