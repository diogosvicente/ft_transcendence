from django.db import models
from django.conf import settings


class Friend(models.Model):
    """
    Representa uma relação de amizade entre dois usuários.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Relaciona com o modelo de usuário personalizado
        related_name='friends',
        on_delete=models.CASCADE
    )
    friend = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Relaciona com o modelo de usuário personalizado
        related_name='friend_of',
        on_delete=models.CASCADE
    )
    status = models.CharField(
        max_length=50,
        choices=[
            ('pending', 'Pending'),
            ('accepted', 'Accepted'),
            ('rejected', 'Rejected'),
        ],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.display_name} -> {self.friend.display_name} ({self.status})"

    class Meta:
        unique_together = ('user', 'friend')  # Garante que uma relação é única


class Message(models.Model):
    """
    Representa uma mensagem enviada de um usuário para outro.
    """
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='sent_messages',
        on_delete=models.CASCADE
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='received_messages',
        on_delete=models.CASCADE
    )
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"From {self.sender.display_name} to {self.receiver.display_name}: {self.message[:30]}..."


class BlockedUser(models.Model):
    """
    Representa um usuário bloqueado por outro.
    """
    blocker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='blocked_users',
        on_delete=models.CASCADE
    )
    blocked = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='blockers',
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.blocker.display_name} blocked {self.blocked.display_name}"

    class Meta:
        unique_together = ('blocker', 'blocked')  # Garante que um bloqueio é único
