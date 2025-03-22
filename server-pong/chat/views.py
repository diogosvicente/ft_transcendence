from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from chat.models import Friend, BlockedUser
from user_management.models import User
from django.db import models
from .models import BlockedUser
from django.db.models import Q


class AllUsersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user

            # Obtém os IDs de amigos e bloqueados
            friends = Friend.objects.filter(Q(user=user) | Q(friend=user)).values_list("user_id", "friend_id") or []
            blocked_users = BlockedUser.objects.filter(Q(blocker=user) | Q(blocked=user)).values_list("blocker_id", "blocked_id") or []

            # 🔥 Corrigindo: "Achatando" a lista de IDs
            friends_ids = list(set([id for pair in friends for id in pair]))  # Converte tuplas em lista de IDs únicos
            blocked_users_ids = list(set([id for pair in blocked_users for id in pair]))  # Mesmo para bloqueados

            print(f"DEBUG - Amigos: {friends_ids}")  # 🛠 Log para debug
            print(f"DEBUG - Bloqueados: {blocked_users_ids}")  # 🛠 Log para debug

            # Exclui amigos e bloqueados
            users = User.objects.exclude(id__in=friends_ids + blocked_users_ids + [user.id])

            print(f"DEBUG - Usuários Encontrados: {users.count()}")  # 🛠 Log para debug

            # Constrói a resposta JSON
            user_list = [
                {
                    "id": u.id,
                    "display_name": u.display_name,
                    "avatar": u.avatar.url if u.avatar else None,
                    "online_status": u.online_status,
                }
                for u in users
            ]

            return Response({"non_friends": user_list}, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            traceback.print_exc()  # 🔥 Log completo do erro
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Lista de amigos
class FriendsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user

            # Verificar amizades onde o usuário logado é o 'user'
            friends_as_user = Friend.objects.filter(user=user, status="accepted").select_related("friend")
            # Verificar amizades onde o usuário logado é o 'friend'
            friends_as_friend = Friend.objects.filter(friend=user, status="accepted").select_related("user")

            # Combinar ambas as listas
            friends_list = [
                {
                    "id": friend.id,  # ID da linha da tabela
                    "user_id": friend.friend.id,  # ID do amigo
                    "display_name": friend.friend.display_name,
                    "avatar": friend.friend.avatar.url if friend.friend.avatar else None,
                    "online_status": friend.friend.online_status,  # Status online do amigo
                }
                for friend in friends_as_user
            ] + [
                {
                    "id": friend.id,  # ID da linha da tabela
                    "user_id": friend.user.id,  # ID do amigo
                    "display_name": friend.user.display_name,
                    "avatar": friend.user.avatar.url if friend.user.avatar else None,
                    "online_status": friend.user.online_status,  # Status online do amigo
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

            # Seleciona todos os usuários bloqueados
            blocked_users = BlockedUser.objects.filter(blocker=user).select_related("blocked")

            # Cria uma lista de usuários bloqueados com os dados necessários
            blocked_list = [
                {
                    "id": blocked.blocked.id,  # ID do usuário bloqueado
                    "display_name": blocked.blocked.display_name,
                    "avatar": blocked.blocked.avatar.url if blocked.blocked.avatar else None,
                    "blocked_record_id": blocked.id,  # ID do registro na tabela chat_blockeduser
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
    permission_classes = [IsAuthenticated]  # Verifica se o usuário está autenticado

    def post(self, request):
        try:
            user = request.user  # Usuário autenticado
            friend_id = request.data.get("friend_id")  # Obtém o ID do amigo a partir do corpo da requisição

            if not friend_id:
                return Response({"error": "O ID do amigo é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

            # Verifica se o amigo existe no banco de dados
            try:
                friend = User.objects.get(id=friend_id)
            except User.DoesNotExist:
                return Response({"error": "Amigo não encontrado."}, status=status.HTTP_404_NOT_FOUND)

            # Verifica se já existe uma solicitação ou amizade ativa
            if Friend.objects.filter(user=user, friend=friend).exists() or Friend.objects.filter(user=friend, friend=user).exists():
                return Response({"error": "Já existe uma solicitação ou amizade ativa."}, status=status.HTTP_400_BAD_REQUEST)

            # Cria a solicitação de amizade
            Friend.objects.create(user=user, friend=friend, status="pending")
            return Response({"message": "Solicitação de amizade enviada com sucesso."}, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Registra o erro no log
            import traceback
            traceback.print_exc()
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

            # Verifica se o usuário a ser bloqueado existe
            try:
                user_to_block = User.objects.get(id=user_to_block_id)
            except User.DoesNotExist:
                return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)

            # Verifica se o usuário já está bloqueado
            if BlockedUser.objects.filter(blocker=user, blocked=user_to_block).exists():
                return Response({"error": "Usuário já está bloqueado."}, status=status.HTTP_400_BAD_REQUEST)

            # Remove a amizade, se existir
            existing_friendship = Friend.objects.filter(
                models.Q(user=user, friend=user_to_block) | models.Q(user=user_to_block, friend=user)
            )
            if existing_friendship.exists():
                existing_friendship.delete()

            # Adiciona à tabela de bloqueados
            BlockedUser.objects.create(blocker=user, blocked=user_to_block)

            return Response({"message": "Usuário bloqueado com sucesso."}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Erro geral: {e}")
            return Response({"error": f"Erro geral: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Excluir amigos
class RemoveFriendView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            # Obtém o request_id enviado pelo cliente
            request_id = request.data.get("id")  # ID da linha na tabela `chat_friend`

            if not request_id:
                return Response({"error": "O ID da solicitação é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                # Busca a linha correspondente ao request_id
                friend_request = Friend.objects.get(id=request_id)
                
                # Obtém os valores user_id e friend_id antes de deletar
                user_id = friend_request.user.id
                friend_id = friend_request.friend.id
                
                # Remove a linha
                friend_request.delete()
                
                # Retorna a mensagem junto com os IDs
                return Response({
                    "message": "Amizade removida com sucesso.",
                    "user_id": user_id,
                    "friend_id": friend_id
                }, status=status.HTTP_200_OK)
            except Friend.DoesNotExist:
                return Response({"error": "Amizade não encontrada."}, status=status.HTTP_404_NOT_FOUND)
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

            # Busca a solicitação de amizade com base no request_id
            friend_request = Friend.objects.filter(id=request_id, status="pending").first()

            if not friend_request:
                return Response({"error": "Solicitação de amizade não encontrada ou já foi processada."}, status=status.HTTP_404_NOT_FOUND)

            # Atualiza o status para "accepted"
            friend_request.status = "accepted"
            friend_request.save()

            # Retorna os dados da solicitação
            return Response(
                {
                    "message": "Solicitação de amizade aceita com sucesso.",
                    "user_id": friend_request.user_id,  # ID do usuário que enviou a solicitação
                    "friend_id": friend_request.friend_id,  # ID do usuário que aceitou a solicitação
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            print(f"Erro ao aceitar solicitação: {e}")  # Log para depuração
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Rejeitar amigos
class RejectFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Obtém o ID diretamente do request
            request_id = request.data.get("request_id")

            if not request_id:
                return Response({"error": "O ID da solicitação é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

            # Filtra o objeto da solicitação de amizade
            friend_request = Friend.objects.filter(id=request_id, status="pending").first()

            if not friend_request:
                return Response({"error": "Solicitação de amizade não encontrada ou já foi processada."}, status=status.HTTP_404_NOT_FOUND)

            # Obtém os IDs do usuário e amigo envolvidos na solicitação
            user_id = friend_request.user_id  # Usuário que recebeu a solicitação
            friend_id = friend_request.friend_id  # Usuário que enviou a solicitação

            # Exclui a solicitação de amizade
            friend_request.delete()

            # Retorna a mensagem de sucesso junto com os IDs envolvidos
            return Response(
                {
                    "message": "Solicitação de amizade rejeitada com sucesso.",
                    "user_id": user_id,
                    "friend_id": friend_id,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            print(f"Erro ao rejeitar solicitação: {e}")  # Log para depuração
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UnblockUserView(APIView):
    """
    View para desbloquear um usuário usando o ID do registro de bloqueio.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            blocked_record_id = request.data.get("blockedRecordId")

            if not blocked_record_id:
                return Response({"error": "O ID do registro de bloqueio é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                # Verifica se o registro existe na tabela BlockedUser
                blocked_user = BlockedUser.objects.get(id=blocked_record_id, blocker=user)
            except BlockedUser.DoesNotExist:
                return Response({"error": "Registro de bloqueio não encontrado ou você não é o bloqueador."}, status=status.HTTP_404_NOT_FOUND)

            # Salva os IDs antes de deletar
            blocker_id = blocked_user.blocker.id
            blocked_id = blocked_user.blocked.id

            # Remove o registro de bloqueio
            blocked_user.delete()

            return Response({
                "message": "Usuário desbloqueado com sucesso.",
                "blocker_id": blocker_id,
                "blocked_id": blocked_id
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class BlockedUsersIdsView(APIView):
    """
    Retorna uma lista de usuários (id, display_name) que bloquearam o usuário atual
    ou foram bloqueados por ele.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            user = request.user
            user_id = user.id

            # Consulta os registros de bloqueio envolvendo o usuário atual
            blocked_users = BlockedUser.objects.filter(
                Q(blocked_id=user_id) | Q(blocker_id=user_id)
            )

            # Coleta os IDs exclusivos dos usuários relacionados aos bloqueios,
            # ignorando valores nulos e o próprio usuário
            blocked_ids = set()
            for blocked in blocked_users:
                if blocked.blocked_id is not None and blocked.blocked_id != user_id:
                    blocked_ids.add(blocked.blocked_id)
                if blocked.blocker_id is not None and blocked.blocker_id != user_id:
                    blocked_ids.add(blocked.blocker_id)

            # Busca os objetos User correspondentes aos IDs coletados
            users = User.objects.filter(id__in=blocked_ids)

            # Monta a lista com os dados necessários (id e display_name)
            data = []
            for u in users:
                data.append({
                    "id": u.id,
                    "display_name": u.display_name,
                })

            return Response({"blocked_users": data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



