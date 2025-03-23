from django.urls import path
from .views import (
    FriendsListView,
    AddFriendView,
    RemoveFriendView,
    AcceptFriendRequestView,
    RejectFriendRequestView,
    BlockUserView,
    BlockedUsersListView,
    PendingFriendRequestsView,
    UnblockUserView,
    BlockedUsersIdsView,
    AllUsersListView
)

urlpatterns = [
    path('all-users/', AllUsersListView.as_view(), name='all-users'),
    path('friends/', FriendsListView.as_view(), name='chat-friends'),
    path('add-friend/', AddFriendView.as_view(), name='add-friend'),
    path('remove-friend/', RemoveFriendView.as_view(), name='remove-friend'),  # Rota existente
    path('accept-friend/', AcceptFriendRequestView.as_view(), name='accept-friend'),
    path('reject-friend/', RejectFriendRequestView.as_view(), name='reject-friend'),
    path('block-user/', BlockUserView.as_view(), name='block-user'),
    path('unblock-user/', UnblockUserView.as_view(), name='unblock-user'),  # Nova rota para desbloquear
    path('blocked-users/', BlockedUsersListView.as_view(), name='blocked-users'),
    path('pending-requests/', PendingFriendRequestsView.as_view(), name='pending-requests'),
    path('blocked-users-ids-list/', BlockedUsersIdsView.as_view(), name='blocked-users-ids-list'),
]
