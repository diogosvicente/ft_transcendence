from django.contrib import admin
from django.urls import path, include
from back_app.views import UsersViewSet
from rest_framework import routers

router = routers.DefaultRouter()
router.register('users', UsersViewSet, basename='Users')

urlpatterns = [
    path('', include(router.urls)),
    # path('users/', users),
]
