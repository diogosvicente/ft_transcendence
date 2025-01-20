from django.urls import re_path
from .game_consumer import GameConsumer

websocket_urlpatterns = [
    # Rota WebSocket para o jogo, identificada pelo match_id
    re_path(r"ws/game/(?P<match_id>\w+)/$", GameConsumer.as_asgi()),
]
