# Generated by Django 5.1.3 on 2024-11-27 15:55

import user_management.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user_management', '0003_user_avatar'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='avatar',
            field=models.ImageField(blank=True, null=True, upload_to=user_management.models.avatar_upload_path),
        ),
    ]
