# Imports padrão do Django
from django.conf import settings
from django.utils.translation import gettext_lazy as _

# Imports de modelos e validações
from django.contrib.auth.password_validation import get_password_validators
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

# Imports do Django REST Framework
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

# Imports do app local
from .models import User
from .serializers import UserSerializer, LoginSerializer
from .utils import generate_2fa_code, send_2fa_code
from chat.models import Friend, BlockedUser

# Outros
from django.core.cache import cache
from django.db.models import Q

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

            # Verifica se o 2FA está ativado
            if user.is_2fa_verified:
                # Gera e envia o código 2FA
                code = generate_2fa_code()
                cache.set(f'2fa_{user.email}', code, timeout=300)  # Código válido por 5 minutos
                send_2fa_code(user.email, code)

                return Response({
                    "message": _("Código 2FA enviado para o e-mail."),
                    "requires_2fa": True  # Indica que o 2FA é necessário
                }, status=status.HTTP_200_OK)

            # Se o 2FA não está ativado, retorna os tokens JWT diretamente
            refresh = RefreshToken.for_user(user)
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "requires_2fa": False  # Indica que o 2FA não é necessário
            }, status=status.HTTP_200_OK)

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
                    "refresh": str(refresh),
                    "access": str(refresh.access_token)
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({"error": _("Usuário não encontrado.")}, status=status.HTTP_404_NOT_FOUND)

        return Response({"error": _("Código inválido ou expirado.")}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    View para logout, invalida o refresh token.
    """
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": _("Refresh token é obrigatório.")}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": _("Logout realizado com sucesso.")}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class GetAvatarView(APIView):
    """
    View para retornar o avatar do usuário.
    """
    def get(self, request):
        email = request.GET.get('email')
        default_avatar_url = f"{settings.MEDIA_URL}avatars/default.png"

        if not email:
            return Response({"avatar": default_avatar_url}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if user.avatar:
                avatar_url = f"{settings.MEDIA_URL}{user.avatar}"
            else:
                avatar_url = default_avatar_url
            return Response({"avatar": avatar_url}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"avatar": default_avatar_url}, status=status.HTTP_404_NOT_FOUND)

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
                'id', 'email', 'display_name', 'avatar'
            )

            return Response({"users": list(users)}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class UserProfileView(APIView):
    """
    View para obter informações do perfil de um usuário.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            # Busca o usuário pelo ID
            user = User.objects.get(id=user_id)

            # Verifica se o usuário logado é amigo do usuário solicitado
            is_friend = Friend.objects.filter(
                Q(user=request.user, friend=user) | Q(user=user, friend=request.user),
                status="accepted"
            ).exists()

            # Dados do perfil
            data = {
                "id": user.id,
                "display_name": user.display_name,
                "avatar": user.avatar.url if user.avatar else None,
                "online_status": user.online_status,
                "wins": user.wins,
                "losses": user.losses
            }
            return Response(data, status=200)
        except User.DoesNotExist:
            return Response({"error": "Usuário não encontrado."}, status=404)