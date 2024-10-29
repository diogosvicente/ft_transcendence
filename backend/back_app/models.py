from django.db import models

class User(models.Model):
    email = models.CharField(max_length=30)
    display_name = models.CharField(max_length=15)
    created_at = models.DateField()

    def __str__(self):
        return self.display_name