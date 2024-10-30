from django.urls import path, include
from rest_framework import routers
from back_app.views import UsersViewSet

router = routers.DefaultRouter()
router.register('users', UsersViewSet, basename='Users')

urlpatterns = [
    path('', include(router.urls)),
]

# Rotas disponíveis na API de Usuários:
# 
# Listar Todos os Usuários (GET): http://localhost:8000/users/
# Listar um Usuário Específico (GET): http://localhost:8000/users/{id}/
# Criar um Novo Usuário (POST): http://localhost:8000/users/
# Atualizar um Usuário (PUT/PATCH): http://localhost:8000/users/{id}/
# Marcar um Usuário como Deletado (DELETE): http://localhost:8000/users/{id}/
