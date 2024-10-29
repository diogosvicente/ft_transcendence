from rest_framework import viewsets
from back_app.models import User
from back_app.serializer import UserSerializer

class UsersViewSet(viewsets.ModelViewSet):
    """Exibindo  todos os Usuários"""
    queryset = User.objects.all()
    serializer_class = UserSerializer