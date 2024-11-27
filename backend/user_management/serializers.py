from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'password', 'avatar']

    def validate_email(self, value):
        # Verifica se o email já existe no banco de dados
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("O e-mail já está cadastrado.")
        return value
