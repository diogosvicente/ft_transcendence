"""
URL configuration for setup project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

# setup/urls.py
from django.contrib import admin  # Importando o módulo admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.i18n import i18n_patterns  # Importando i18n_patterns
from django.conf.urls.static import static

urlpatterns = [
    # Não use i18n_patterns para o admin (isso é opcional, dependendo do seu projeto)
    path('admin/', admin.site.urls),
    path('api/user-management/', include('user_management.urls')),  # URLs do app
    path('api/chat/', include('chat.urls')),  # Corrigido para incluir as URLs do app "chat"
]

# Usar i18n_patterns para URLs com prefixo de idioma
urlpatterns += i18n_patterns(
    
    # prefix_default_language=True  # Não usa prefixo para o idioma padrão
)

# Adicionar suporte para arquivos de mídia em DEBUG mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
