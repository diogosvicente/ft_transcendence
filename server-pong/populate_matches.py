from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from game.models import Match  # ajuste 'myapp' conforme o nome do seu app

# usage:
# python manage.py shell < populate_matches.py

User = get_user_model()

# Obtenha o usuário principal (id=4)
try:
    user_main = User.objects.get(id=4)
except User.DoesNotExist:
    raise Exception("Usuário com id=4 não encontrado!")

# Se o atributo 'username' não existir, adicione-o dinamicamente usando display_name
if not hasattr(user_main, 'username'):
    user_main.username = user_main.display_name

# Lista com dados dos oponentes e resultados desejados para simulação
opponents_data = [
    {
        "email": "alice@example.com",
        "display_name": "Alice",
        "alias": "Ali",
        "result": "Derrota",  # usuário principal perde
        "score_main": 1,
        "score_opp": 3
    },
    {
        "email": "bob@example.com",
        "display_name": "Bob",
        "alias": None,
        "result": "Vitoria",  # usuário principal vence
        "score_main": 4,
        "score_opp": 2
    },
    {
        "email": "carol@example.com",
        "display_name": "Carol",
        "alias": "Caz",
        "result": "Derrota",  # usuário principal perde
        "score_main": 2,
        "score_opp": 5
    },
    {
        "email": "dave@example.com",
        "display_name": "Dave",
        "alias": None,
        "result": "Vitoria",  # usuário principal vence
        "score_main": 3,
        "score_opp": 0
    },
    {
        "email": "eve@example.com",
        "display_name": "Eve",
        "alias": "Evie",
        "result": "Derrota",  # usuário principal perde
        "score_main": 0,
        "score_opp": 1
    }
]

# Para cada oponente, obtenha ou crie o usuário e registre uma partida
for data in opponents_data:
    opponent, created = User.objects.get_or_create(
        email=data["email"],
        defaults={
            "password": "opponent123",  # senha inicial; logo a seguir é criptografada
            "display_name": data["display_name"],
            "avatar": SimpleUploadedFile(
                name=f'avatar_{data["display_name"]}.jpg',
                content=b'conteudo-da-imagem',
                content_type='image/jpeg'
            ),
            "is_active": True,
            "is_staff": False,
            "is_superuser": False,
            "is_2fa_verified": False,
            "wins": 0,
            "losses": 0,
            "online_status": True,
            "current_language": "pt"
        }
    )
    if created:
        opponent.set_password("opponent123")
        opponent.save()

    # Adiciona o atributo 'username', se necessário
    if not hasattr(opponent, 'username'):
        opponent.username = opponent.display_name

    # Define o vencedor de acordo com o resultado desejado:
    # Se o resultado for "Vitoria", o usuário principal vence; se "Derrota", o oponente vence.
    winner_id = user_main.id if data["result"] == "Vitoria" else opponent.id

    # Cria a partida sem associar a um torneio (tournament = None)
    match = Match.objects.create(
        tournament=None,
        player1=user_main,
        player2=opponent,
        score_player1=data["score_main"],
        score_player2=data["score_opp"],
        status='completed',
        is_winner_by_wo=False,
        played_at=timezone.now(),
        winner_id=winner_id,
        last_tournament_match=False
    )
    print(f"Partida criada: {match}")

