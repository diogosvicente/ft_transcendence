# Generated by Django 5.1.3 on 2024-12-27 04:25

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='match',
            name='player1',
        ),
        migrations.RemoveField(
            model_name='match',
            name='player2',
        ),
        migrations.RemoveField(
            model_name='match',
            name='tournament',
        ),
        migrations.RemoveField(
            model_name='match',
            name='winner',
        ),
        migrations.DeleteModel(
            name='Tournament',
        ),
        migrations.DeleteModel(
            name='Match',
        ),
    ]
