from rest_framework import serializers
from back_app.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'display_name', 'avatar', 'created_at', 'updated_at', 'is_deleted']
        read_only_fields = ['id', 'created_at', 'updated_at']
