from django.urls import re_path
from chat.notification_consumer import NotificationConsumer

websocket_urlpatterns = [
    path("ws/game/notifications/", NotificationConsumer.as_asgi()),  # Rota para o app `game`
]
