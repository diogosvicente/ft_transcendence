from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
from .serializers import UserSerializer, LoginSerializer
from .models import User
from .utils import generate_2fa_code, send_2fa_code
from django.contrib.auth.password_validation import get_password_validators


class UserRegistrationView(APIView):
    """
    View para registro de usuários.
    """
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Usuário cadastrado com sucesso!"}, status=status.HTTP_201_CREATED)
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
                    "message": "Código 2FA enviado para o e-mail.",
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
                    "message": "2FA verificado com sucesso.",
                    "refresh": str(refresh),
                    "access": str(refresh.access_token)
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"error": "Código inválido ou expirado."}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    View para logout, invalida o refresh token.
    """
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout realizado com sucesso."}, status=status.HTTP_200_OK)
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


class PasswordRequirementsView(APIView):
    """
    View para retornar os requisitos de senha do backend.
    """
    def get(self, request):
        validators = get_password_validators(settings.AUTH_PASSWORD_VALIDATORS)
        requirements = []

        for validator in validators:
            if hasattr(validator, 'get_help_text'):
                requirements.append(validator.get_help_text())

        return Response({"requirements": requirements}, status=status.HTTP_200_OK)