from django.shortcuts import render

# def index(request):
#     return render(request, 'client_pong/index.html')

def index(request):
    # Renderiza o template "index.html"
    return render(request, 'client_pong/index.html')