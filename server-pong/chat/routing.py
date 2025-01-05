from django.urls import re_path
from .notification_consumer import NotificationConsumer
from .chat_consumer import ChatConsumer

websocket_urlpatterns = [
    re_path(r"ws/notifications/$", NotificationConsumer.as_asgi()),
    re_path(r"ws/chat/(?P<room>[^/]+)/$", ChatConsumer.as_asgi()),  # Room dinâmico
]
