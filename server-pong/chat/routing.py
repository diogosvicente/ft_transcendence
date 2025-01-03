from django.urls import re_path
from .notification_consumer import NotificationConsumer
from .chat_consumer import ChatConsumer

websocket_urlpatterns = [
    # WebSocket para notificações
    re_path(r"ws/notifications/$", NotificationConsumer.as_asgi()),

    # WebSocket para chat
    re_path(r"ws/chat/$", ChatConsumer.as_asgi()),
]
