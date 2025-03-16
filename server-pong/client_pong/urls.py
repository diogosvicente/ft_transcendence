from django.urls import path
from .views import index

# urlpatterns = [
#     path('', index, name='index'),
# ]

urlpatterns = [
    # Se quiser que qualquer path chame a mesma view (catch-all), faça algo assim:
    path('', index, name='index'),
    path('<path:anything>', index),  # Envia qualquer rota para o mesmo template
]