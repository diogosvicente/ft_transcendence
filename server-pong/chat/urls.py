from django.urls import path
from .views import (
    FriendsListView,
    AddFriendView,
    RemoveFriendView,
    AcceptFriendRequestView,
    RejectFriendRequestView,
    BlockUserView,
    PendingFriendRequestsView,
    BlockedUsersListView,
)

urlpatterns = [
    path('friends/', FriendsListView.as_view(), name='chat-friends'),
    path('add-friend/', AddFriendView.as_view(), name='add-friend'),
    path('remove-friend/', RemoveFriendView.as_view(), name='remove-friend'),  # Nova rota
    path('accept-friend/', AcceptFriendRequestView.as_view(), name='accept-friend'),
    path('reject-friend/', RejectFriendRequestView.as_view(), name='reject-friend'),
    path('block-user/', BlockUserView.as_view(), name='block-user'),  # Corrigido nome da rota
    path('blocked-users/', BlockedUsersListView.as_view(), name='blocked-users'),  # Nova rota
    path('pending-requests/', PendingFriendRequestsView.as_view(), name='pending-requests'),  # Nova rota
]
