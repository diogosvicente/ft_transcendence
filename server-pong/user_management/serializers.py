from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer para registro de usuários.
    """
    class Meta:
        model = User
        fields = ['email', 'password', 'avatar']

    def create(self, validated_data):
        # Valida a senha usando os validadores do Django
        try:
            validate_password(validated_data['password'])
        except Exception as e:
            raise ValidationError({'password': list(e.messages)})

        # Criptografa a senha antes de salvar
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

    def validate_email(self, value):
        # Verifica se o email já existe no banco de dados
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("O e-mail já está cadastrado.")
        return value


class LoginSerializer(serializers.Serializer):
    """
    Serializer para autenticação de usuários.
    """
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        # Verifica se o usuário existe
        user = User.objects.filter(email=email).first()
        if not user or not check_password(password, user.password):
            raise serializers.ValidationError("Credenciais inválidas. Verifique o email e a senha.")

        attrs['user'] = user
        return attrs