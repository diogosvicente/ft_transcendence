from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from chat.models import Friend
from user_management.models import User


class FriendsListView(APIView):
    """
    View para listar os amigos do usuário autenticado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Obtém o usuário autenticado
            user = request.user

            # Busca os amigos aceitos e inverte a consulta para incluir amigos como user e friend
            friends_as_user = Friend.objects.filter(user=user, status="accepted").select_related("friend")
            friends_as_friend = Friend.objects.filter(friend=user, status="accepted").select_related("user")

            # Monta a lista de amigos de ambas as direções
            friend_list = [
                {
                    "id": friend.friend.id,
                    "display_name": friend.friend.display_name,
                    "avatar": friend.friend.avatar.url if friend.friend.avatar else None,
                }
                for friend in friends_as_user
            ] + [
                {
                    "id": friend.user.id,
                    "display_name": friend.user.display_name,
                    "avatar": friend.user.avatar.url if friend.user.avatar else None,
                }
                for friend in friends_as_friend
            ]

            return Response({"friends": friend_list}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
