from django.urls import path, re_path
from .views import index

urlpatterns = [
    # Se quiser que qualquer path chame a mesma view (catch-all), faça algo assim:
    path('', index, name='index'),
    re_path(r'^(?:.*)/?$', index),
]