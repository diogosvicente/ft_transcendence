from django.core.mail import send_mail
import random

def generate_2fa_code():
    return random.randint(100000, 999999)

def send_2fa_code(email, code):
    subject = "Seu código de autenticação"
    message = f"Seu código de autenticação é: {code}"
    send_mail(subject, message, 'noreply@example.com', [email])
