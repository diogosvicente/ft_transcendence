# Imports padrão do Django
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.cache import cache
from django.db.models import Q
from django.views import View
from django.http import JsonResponse
from django.utils.timezone import now

# Imports do Django REST Framework
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

# Imports relacionados ao JWT
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

# Imports de validações
from django.contrib.auth.password_validation import get_password_validators

# Imports de modelos
from .models import User
from chat.models import Friend, BlockedUser

# Imports do app local
from .serializers import UserSerializer, LoginSerializer
from .utils import generate_2fa_code, send_2fa_code

class UserRegistrationView(APIView):
    """
    View para registro de usuários.
    """
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": _("Usuário cadastrado com sucesso!")}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    """
    View para autenticação de usuários.
    """
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']

            # Atualiza o online_status para True e salva o momento do login
            user.online_status = True
            user.last_login = now()  # Atualiza a última data/hora de login
            user.save()

            if user.is_2fa_verified:
                code = generate_2fa_code()
                cache.set(f'2fa_{user.email}', code, timeout=300)
                send_2fa_code(user.email, code)

                return Response({
                    "message": _("Código 2FA enviado para o e-mail."),
                    "requires_2fa": True
                }, status=status.HTTP_200_OK)

            # Gera os tokens de acesso e refresh
            refresh = RefreshToken.for_user(user)
            response_data = {
                "id": user.id,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "requires_2fa": False
            }
            return Response(response_data, status=status.HTTP_200_OK)

        # Retorna erro caso a validação falhe
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class Validate2FACodeView(APIView):
    """
    View para validação do código 2FA.
    """
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        cached_code = cache.get(f'2fa_{email}')

        if cached_code and str(cached_code) == str(code):
            try:
                user = User.objects.get(email=email)
                user.is_2fa_verified = True
                user.save()

                # Gera tokens JWT após validação bem-sucedida
                refresh = RefreshToken.for_user(user)
                return Response({
                    "message": _("2FA verificado com sucesso."),
                    "id": user.id,  # Inclui o ID do usuário
                    "refresh": str(refresh),
                    "access": str(refresh.access_token)
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({"error": _("Usuário não encontrado.")}, status=status.HTTP_404_NOT_FOUND)

        return Response({"error": _("Código inválido ou expirado.")}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    """
    View para logout, invalida o refresh token e atualiza o online_status para False.
    """
    permission_classes = [IsAuthenticated]  # Garante que o usuário esteja autenticado

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": _("Refresh token é obrigatório.")}, status=status.HTTP_400_BAD_REQUEST)

            # Invalida o token de refresh
            token = RefreshToken(refresh_token)
            token.blacklist()

            # Atualiza o online_status do usuário para False
            user = request.user
            if user.online_status:
                user.online_status = False
                user.save()
                message = _("Logout realizado com sucesso e status alterado para offline.")
            else:
                message = _("Logout realizado com sucesso. O status já estava offline.")

            return Response({"message": message}, status=status.HTTP_200_OK)
        except Exception as e:
            # Log do erro para depuração
            print(f"Erro no logout: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GetUserInfo(APIView):
    """
    View para retornar ou atualizar informações do usuário.
    """
    permission_classes = [IsAuthenticated]  # Garante que o usuário está autenticado

    def get(self, request, user_id):  # Use `user_id` para combinar com a URL
        default_avatar_url = f"{settings.MEDIA_URL}avatars/default.png"

        try:
            user = User.objects.get(id=user_id)  # Busca o usuário pelo ID
            avatar_url = f"{settings.MEDIA_URL}{user.avatar}" if user.avatar else default_avatar_url
            return Response(
                {
                    "avatar": avatar_url,
                    "display_name": user.display_name,
                    "losses": user.losses,
                    "wins": user.wins,
                    "online_status": user.online_status,
                    "is_2fa_verified": user.is_2fa_verified
                },
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {
                    "error": "Usuário não encontrado.",
                    "avatar": default_avatar_url,
                    "display_name": None,
                    "losses": None,
                    "wins": None,
                    "online_status": None,
                    "is_2fa_verified": None
                },
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Erro interno: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request, user_id):  # Use `user_id` para combinar com a URL
        try:
            user = User.objects.get(id=user_id)  # Busca o usuário pelo ID
            
            # Atualiza o campo `online_status` se fornecido
            if "online_status" in request.data:
                user.online_status = request.data["online_status"]
                user.save()
                return Response(
                    {"message": "Online status atualizado com sucesso."},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"error": "Campo `online_status` não fornecido."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except User.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Erro interno: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GetTokenView(APIView):
    """
    Retorna o access token atual do usuário logado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            # Busca o token mais recente do usuário logado
            token = OutstandingToken.objects.filter(user=user).last()
            if token:
                return Response({"token": token.token}, status=200)
            return Response({"error": "Token não encontrado."}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class ExcludeSelfAndFriendsUserListView(APIView):
    """
    View para listar usuários, excluindo o usuário autenticado, seus amigos, solicitações pendentes e usuários bloqueados.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Usuário autenticado
            current_user = request.user

            # IDs dos amigos onde o usuário atual é o 'user'
            friends_as_user = Friend.objects.filter(user=current_user, status="accepted").values_list('friend_id', flat=True)

            # IDs dos amigos onde o usuário atual é o 'friend'
            friends_as_friend = Friend.objects.filter(friend=current_user, status="accepted").values_list('user_id', flat=True)

            # IDs de solicitações pendentes enviadas pelo usuário atual
            pending_sent = Friend.objects.filter(user=current_user, status="pending").values_list('friend_id', flat=True)

            # IDs de solicitações pendentes recebidas pelo usuário atual
            pending_received = Friend.objects.filter(friend=current_user, status="pending").values_list('user_id', flat=True)

            # IDs de usuários bloqueados pelo usuário atual
            blocked_users = BlockedUser.objects.filter(blocker=current_user).values_list('blocked_id', flat=True)

            # IDs de usuários que bloquearam o usuário atual
            blocked_by_users = BlockedUser.objects.filter(blocked=current_user).values_list('blocker_id', flat=True)

            # Combinar todas as IDs a serem excluídas (amigos + solicitações pendentes + bloqueados)
            excluded_ids = set(friends_as_user).union(
                set(friends_as_friend),
                set(pending_sent),
                set(pending_received),
                set(blocked_users),
                set(blocked_by_users)
            )

            # Excluir o usuário atual e os IDs a serem excluídos
            users = User.objects.exclude(id__in=excluded_ids).exclude(id=current_user.id).values(
                'id', 'email', 'display_name', 'avatar', 'online_status'  # Inclui o campo `online_status`
            )

            return Response({"users": list(users)}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class UserProfileView(APIView):
    """
    View para obter e atualizar informações do perfil de um usuário.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            data = {
                "id": user.id,
                "display_name": user.display_name,
                "avatar": user.avatar.url if user.avatar else None,
                "online_status": user.online_status,
                "wins": user.wins,
                "losses": user.losses,
                "is_2fa_verified": user.is_2fa_verified
            }
            return Response(data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)

            # Atualiza o display_name se fornecido
            if "display_name" in request.data:
                user.display_name = request.data["display_name"]

            # Atualiza a senha, se fornecida (usando set_password para aplicar hash e validações)
            if "password" in request.data and request.data["password"]:
                user.set_password(request.data["password"])

            # Atualiza o campo is_2fa_verified se fornecido
            if "is_2fa_verified" in request.data:
                value = request.data["is_2fa_verified"]
                user.is_2fa_verified = value.lower() == "true" if isinstance(value, str) else bool(value)

            # Atualiza o avatar se um arquivo for enviado
            if "avatar" in request.FILES:
                user.avatar = request.FILES["avatar"]

            user.save()

            data = {
                "id": user.id,
                "display_name": user.display_name,
                "avatar": user.avatar.url if user.avatar else None,
                "is_2fa_verified": user.is_2fa_verified,
            }
            return Response(data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MatchHistoryView(View):
    def get(self, request, user_id, *args, **kwargs):
        # Lógica será implementada depois
        return JsonResponse({"message": "Histórico de partidas ainda não implementado."}, status=200)

class UserRelationshipView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = request.user

            # Verifica o relacionamento de amizade
            friend_relation = Friend.objects.filter(
                models.Q(user=user, friend_id=user_id) | models.Q(user_id=user_id, friend=user)
            ).first()

            friendship_id = friend_relation.id if friend_relation else None
            status_value = friend_relation.status if friend_relation else None
            friend_user_id = friend_relation.user_id if friend_relation else None
            friend_friend_id = friend_relation.friend_id if friend_relation else None

            # Verifica se o usuário está bloqueado
            blocked_relation = BlockedUser.objects.filter(
                models.Q(blocker=user, blocked_id=user_id) | models.Q(blocker_id=user_id, blocked=user)
            ).first()
            is_blocked = blocked_relation is not None
            blocked_record_id = blocked_relation.id if blocked_relation else None
            blocked_id = blocked_relation.blocked_id if blocked_relation else None
            blocker_id = blocked_relation.blocker_id if blocked_relation else None

            return Response({
                "friendship_id": friendship_id,  # ID do relacionamento de amizade, se existir
                "status": status_value,  # Status do relacionamento (pending ou accepted)
                "user_id": friend_user_id,  # user_id da tabela chat_friend
                "friend_id": friend_friend_id,  # friend_id da tabela chat_friend
                "is_blocked": is_blocked,  # Se o usuário está bloqueado
                "blocked_id": blocked_id,  # ID do usuário bloqueado, se existir
                "blocker_id": blocker_id,  # ID do usuário que bloqueou, se existir
                "blocked_record_id": blocked_record_id,  # ID do registro de bloqueio na tabela BlockedUser
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VictoryRankingAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Ordena os usuários pelo número de vitórias (wins)
        ranking = User.objects.order_by('-wins')[:10]  # Top 10 usuários

        data = [
            {
                "id": user.id,
                "display_name": user.display_name,
                "avatar": user.avatar.url if user.avatar else None,
                "wins": user.wins,
                "losses": user.losses,
            }
            for user in ranking
        ]
        return Response(data, status=200)
