Componentes Ideais para Entrega

1. Major module: Use a Framework as Backend (Django)
Motivo: Django é um framework poderoso e bem documentado, ideal para construir rapidamente a parte backend de uma aplicação web complexa como a ft_transcendence.

2.1 Minor module: Use a Front-End Framework or Toolkit (Bootstrap) (conta como 0.5 major)
Motivo: Bootstrap facilita o desenvolvimento frontend, permitindo a criação rápida de interfaces responsivas e estilizadas, integrando-se bem com React.

2.2 Minor module: Use a Database for the Backend (PostgreSQL) (conta como 0.5 major)
Motivo: PostgreSQL é uma escolha sólida para banco de dados, com suporte robusto para operações complexas e integração direta com Django.

3. Major module: Standard user management, authentication, users across tournaments
Motivo: Django fornece uma infraestrutura nativa para gestão de usuários e autenticação, tornando esta funcionalidade essencial relativamente simples de implementar.

4. Major module: Implement Two-Factor Authentication (2FA) and JWT
Motivo: Django tem suporte bem documentado para JWT e 2FA através de bibliotecas populares, o que facilita a adição de uma camada extra de segurança.

5. Major module: Add Another Game with User History and Matchmaking
Motivo: Adicionar um novo jogo com histórico de usuário e matchmaking oferece uma funcionalidade atraente e é viável dentro do ecossistema Django, utilizando as capacidades do framework para gestão de dados e lógica de jogo.

6. Major module: Implement WAF/ModSecurity with Hardened Configuration and HashiCorp Vault for Secrets Management
Motivo: Integrar um WAF (Web Application Firewall) e gerenciar segredos com HashiCorp Vault oferece uma segurança robusta para a aplicação, protegendo contra vulnerabilidades comuns e garantindo a proteção dos dados sensíveis.

7. Major module: Designing the Backend as Microservices
Motivo: Projetar o backend como microservices, embora complexo, permite maior escalabilidade e modularidade, e Django pode ser configurado para suportar essa arquitetura com as práticas adequadas.

Total:
7 Majors (contando 2 minors como 1 major)