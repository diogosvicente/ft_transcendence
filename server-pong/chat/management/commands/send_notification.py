from django.core.management.base import BaseCommand
from channels.layers import get_channel_layer
import asyncio

class Command(BaseCommand):
    help = "Envia uma notificação para um usuário específico ou para todos os usuários conectados."

    def add_arguments(self, parser):
        parser.add_argument("recipient_id", type=str, help="ID do usuário destinatário ou 'notifications' para todos.")

    def handle(self, *args, **options):
        recipient_id = options["recipient_id"]
        channel_layer = get_channel_layer()

        async def send_notification():
            await channel_layer.group_send(
                f"user_{recipient_id}" if recipient_id != "notifications" else "notifications",
                {
                    "type": "send_notification",
                    "message": f"Este é um teste de alerta para {'todos' if recipient_id == 'notifications' else f'o usuário {recipient_id}'}!",
                }
            )

        asyncio.run(send_notification())
        self.stdout.write(self.style.SUCCESS(f"Notificação enviada para {recipient_id}."))
