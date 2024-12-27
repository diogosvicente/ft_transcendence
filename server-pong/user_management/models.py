from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
import os
from datetime import datetime
from django.utils.translation import gettext_lazy as _  # Importando gettext_lazy
from django.conf import settings

def avatar_upload_path(instance, filename):
    name, extension = os.path.splitext(filename)
    name = name.replace(" ", "_")
    new_filename = f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{extension}"
    return os.path.join('avatars/', new_filename)

class UserManager(BaseUserManager):
    """
    Gerenciador de usuários personalizado.
    """
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('O campo email é obrigatório.'))  # Usando gettext_lazy para tradução
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser):
    """
    Modelo de usuário personalizado.
    """
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True, null=True)
    is_active = models.BooleanField(default=True)  # Necessário para autenticação
    is_staff = models.BooleanField(default=False)  # Permissão de administrador
    is_superuser = models.BooleanField(default=False)  # Indica superusuário
    is_2fa_verified = models.BooleanField(default=False)  # Indica se o 2FA foi verificado

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Sem campos adicionais obrigatórios

    def __str__(self):
        return self.email

class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_management_profile'
    )
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    online_status = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email} - Wins: {self.wins}, Losses: {self.losses}"
