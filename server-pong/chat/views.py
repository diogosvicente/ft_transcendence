from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from chat.models import Friend, BlockedUser
from user_management.models import User
from django.db import models

# Lista de amigos
class FriendsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user

            friends_as_user = Friend.objects.filter(user=user, status="accepted").select_related("friend")
            friends_as_friend = Friend.objects.filter(friend=user, status="accepted").select_related("user")

            friends_list = [
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

            return Response({"friends": friends_list}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Lista de bloqueados
class BlockedUsersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user

            blocked_users = BlockedUser.objects.filter(blocker=user).select_related("blocked")

            blocked_list = [
                {
                    "id": blocked.blocked.id,
                    "display_name": blocked.blocked.display_name,
                    "avatar": blocked.blocked.avatar.url if blocked.blocked.avatar else None,
                }
                for blocked in blocked_users
            ]

            return Response({"blocked_users": blocked_list}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Lista de solicitações pendentes
class PendingFriendRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user

            pending_sent = Friend.objects.filter(user=user, status="pending").select_related("friend")
            pending_received = Friend.objects.filter(friend=user, status="pending").select_related("user")

            pending_list = [
                {
                    "id": request.id,  # ID da tabela `chat_friend`
                    "user_id": request.friend.id,
                    "display_name": request.friend.display_name,
                    "avatar": request.friend.avatar.url if request.friend.avatar else None,
                    "direction": "sent"
                }
                for request in pending_sent
            ] + [
                {
                    "id": request.id,  # ID da tabela `chat_friend`
                    "user_id": request.user.id,
                    "display_name": request.user.display_name,
                    "avatar": request.user.avatar.url if request.user.avatar else None,
                    "direction": "received"
                }
                for request in pending_received
            ]

            return Response({"pending_requests": pending_list}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Adicionar amigos
class AddFriendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            friend_id = request.data.get("friend_id")

            if not friend_id:
                return Response({"error": "O ID do amigo é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                friend = User.objects.get(id=friend_id)
            except User.DoesNotExist:
                return Response({"error": "Amigo não encontrado."}, status=status.HTTP_404_NOT_FOUND)

            if Friend.objects.filter(user=user, friend=friend).exists() or Friend.objects.filter(user=friend, friend=user).exists():
                return Response({"error": "Já existe uma solicitação ou amizade ativa."}, status=status.HTTP_400_BAD_REQUEST)

            Friend.objects.create(user=user, friend=friend, status="pending")
            return Response({"message": "Solicitação de amizade enviada com sucesso."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Bloquear amigos ou não amigos
class BlockUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            user_to_block_id = request.data.get("user_id")

            if not user_to_block_id:
                return Response({"error": "O ID do usuário é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user_to_block = User.objects.get(id=user_to_block_id)
            except User.DoesNotExist:
                return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)

            if BlockedUser.objects.filter(blocker=user, blocked=user_to_block).exists():
                return Response({"error": "Usuário já está bloqueado."}, status=status.HTTP_400_BAD_REQUEST)

            # Bloqueio e remoção de amigos
            try:
                BlockedUser.objects.create(blocker=user, blocked=user_to_block)
                Friend.objects.filter(
                    models.Q(user=user, friend=user_to_block) | models.Q(user=user_to_block, friend=user)
                ).delete()
            except Exception as e:
                print(f"Erro ao bloquear usuário: {e}")
                return Response({"error": f"Erro ao bloquear usuário: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({"message": "Usuário bloqueado com sucesso."}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Erro geral: {e}")
            return Response({"error": f"Erro geral: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Excluir amigos
class RemoveFriendView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            user = request.user
            friend_id = request.data.get("friend_id")

            if not friend_id:
                return Response({"error": "O ID do amigo é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                friend = Friend.objects.get(user=user, friend_id=friend_id, status="accepted")
            except Friend.DoesNotExist:
                return Response({"error": "Amizade não encontrada."}, status=status.HTTP_404_NOT_FOUND)

            friend.delete()
            return Response({"message": "Amizade removida com sucesso."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Aceitar amigos
class AcceptFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Obtem o ID diretamente do request
            request_id = request.data.get("request_id")  # Certifique-se de que o ID está sendo enviado como "id"

            if not request_id:
                return Response({"error": "O ID da solicitação é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

            # Atualiza diretamente o status na tabela chat_friend
            updated_rows = Friend.objects.filter(id=request_id, status="pending").update(status="accepted")

            if updated_rows == 0:  # Nenhuma linha foi atualizada
                return Response({"error": "Solicitação de amizade não encontrada ou já foi aceita."}, status=status.HTTP_404_NOT_FOUND)

            return Response({"message": "Solicitação de amizade aceita com sucesso."}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Erro ao aceitar solicitação: {e}")  # Log para depuração
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Rejeitar amigos
class RejectFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Obtem o ID diretamente do request
            request_id = request.data.get("request_id")  # Certifique-se de que o ID está sendo enviado como "id"

            if not request_id:
                return Response({"error": "O ID da solicitação é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

            # Exclui a linha correspondente ao request_id
            deleted_rows = Friend.objects.filter(id=request_id, status="pending").delete()

            if deleted_rows[0] == 0:  # Nenhuma linha foi deletada
                return Response({"error": "Solicitação de amizade não encontrada ou já foi processada."}, status=status.HTTP_404_NOT_FOUND)

            return Response({"message": "Solicitação de amizade rejeitada com sucesso."}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Erro ao rejeitar solicitação: {e}")  # Log para depuração
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
