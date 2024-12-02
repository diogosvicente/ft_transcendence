from django.urls import path
from .views import UserRegistrationView, LoginView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
]

# URLs
# Registro: http://127.0.0.1:8000/api/user-management/register/
# Login: http://127.0.0.1:8000/api/user-management/login/
