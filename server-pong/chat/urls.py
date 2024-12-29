from django.urls import path
from chat.views import FriendsListView

urlpatterns = [
    path("friends/", FriendsListView.as_view(), name="chat-friends"),
]
