from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),  # Admin do Django
    path('api/user-management/', include('user_management.urls')),  # App User Management
    path('api/chat/', include('chat.urls')),  # App Chat
    path('api/game/', include('game.urls')),  # App Game
    path('pong/', include('client_pong.urls')),  # App Frontend => client_pong
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

