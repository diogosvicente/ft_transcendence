from django.urls import path
from .views import UserRegistrationView, LoginView, LogoutView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('logout/', LogoutView.as_view(), name='user-logout'),
]

# URLs disponíveis:
# Registro: http://127.0.0.1:8000/api/user-management/register/
# Login: http://127.0.0.1:8000/api/user-management/login/
# Logout: http://127.0.0.1:8000/api/user-management/logout/
