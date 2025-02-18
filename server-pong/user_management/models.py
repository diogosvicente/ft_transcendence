from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
import os
from datetime import datetime
from django.utils.translation import gettext_lazy as _


def avatar_upload_path(instance, filename):
    """
    Define o caminho de upload para avatares do usuário.
    """
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
            raise ValueError(_('O campo email é obrigatório.'))
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
    Modelo de usuário unificado com informações de perfil.
    """
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=150, blank=False, null=True) #mude para False
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_2fa_verified = models.BooleanField(default=False)
    
    # Campos de perfil
    wins = models.IntegerField(default=0)  # Quantidade de vitórias
    losses = models.IntegerField(default=0)  # Quantidade de derrotas
    online_status = models.BooleanField(default=False)  # Status online

    CURRENT_LANGUAGE_CHOICES = [
        ('pt_BR', 'Português (Brasil)'),
        ('en', 'English'),
        ('es', 'Español'),
    ]
    current_language = models.CharField(
        max_length=5,
        choices=CURRENT_LANGUAGE_CHOICES,
        default='pt_BR',
        verbose_name=_("Idioma atual")
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.display_name or self.email  # Prioriza display_name para exibição
