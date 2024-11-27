from django.db import models

class User(models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)

    class Meta:
        db_table = 'user_management'  # Define o nome da tabela

    def __str__(self):
        return self.email
