import os
from datetime import datetime
from django.db import models

def avatar_upload_path(instance, filename):
    # Extrai o nome original (sem extensão) e a extensão do arquivo
    name, extension = os.path.splitext(filename)
    # Remove espaços ou caracteres indesejados do nome original
    name = name.replace(" ", "_")
    # Cria o novo nome com o nome original + data e hora + extensão
    new_filename = f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{extension}"
    # Retorna o caminho completo para o arquivo
    return os.path.join('avatars/', new_filename)

class User(models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True, null=True)

    class Meta:
        db_table = 'user_management'

    def __str__(self):
        return self.email
