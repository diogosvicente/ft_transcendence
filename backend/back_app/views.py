from rest_framework import viewsets
from back_app.models import User
from back_app.serializer import UserSerializer
from rest_framework.response import Response
from rest_framework import status

class UsersViewSet(viewsets.ModelViewSet):
    """CRUD completo para os usuários"""
    queryset = User.objects.filter(is_deleted=False)  # Listar apenas os não deletados
    serializer_class = UserSerializer

    def destroy(self, request, *args, **kwargs):
        """Sobrescreve o método DELETE para usar is_deleted"""
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
