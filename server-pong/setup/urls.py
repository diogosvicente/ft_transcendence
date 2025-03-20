from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),  # Admin
    path('api/user-management/', include('user_management.urls')),  # API endpoints
    path('api/chat/', include('chat.urls')),
    path('api/game/', include('game.urls')),
    path('', include('client_pong.urls')),  # Serve the frontend
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

