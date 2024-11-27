from django.urls import path
from .views import UserRegistrationView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
]

# urls
# http://127.0.0.1:8000/api/user-management/register/