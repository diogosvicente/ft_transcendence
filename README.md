Tecnologias Utilizadas
Backend: Python com Django
Frontend: React
Banco de Dados: PostgreSQL
Orquestração: Docker
Arquitetura: Single-Page Application (SPA)
Componentes Ideais para Entrega
Major module: Use a Framework as Backend (Django)
Motivo: Django é um framework robusto e amplamente utilizado que facilita o desenvolvimento rápido de um backend escalável e seguro. Ele também integra-se bem com PostgreSQL, fornecendo uma base sólida para o gerenciamento de dados.
2.1 Minor module: Use a Front-End Framework or Toolkit (React) (conta como 0.5 major)

Motivo: React é uma biblioteca de front-end poderosa e eficiente que permite criar interfaces de usuário dinâmicas e responsivas. Ele é ideal para Single-Page Applications (SPA), oferecendo uma experiência fluida para os usuários.
2.2 Minor module: Use a Database for the Backend (PostgreSQL) (conta como 0.5 major)

Motivo: PostgreSQL é um banco de dados relacional confiável e altamente escalável. Sua integração com Django permite uma gestão eficiente e segura dos dados, atendendo aos requisitos de aplicações web complexas.
Major module: Standard user management, authentication, users across tournaments

Motivo: A gestão de usuários e a autenticação são cruciais para o projeto ft_transcendence. Django facilita a implementação dessas funcionalidades com segurança, utilizando seu sistema integrado de autenticação e gestão de permissões.
Major module: Remote players

Motivo: A possibilidade de jogadores remotos é essencial para um projeto multiplayer como o ft_transcendence. Django e tecnologias de web sockets podem ser utilizados para suportar a comunicação em tempo real entre jogadores remotos.
Major module: Live chat

Motivo: O chat em tempo real melhora a interação social entre os jogadores. Essa funcionalidade pode ser implementada com Django Channels, que facilita o desenvolvimento de aplicações assíncronas e comunicação em tempo real via WebSockets.
6.1 Minor module: Expanding Browser Compatibility (conta como 0.5 major)

Motivo: Aumentar a compatibilidade com diferentes navegadores garante que o ft_transcendence seja acessível a uma maior quantidade de usuários. Testar e ajustar a aplicação para funcionar em vários navegadores melhora a experiência do usuário.
6.2 Minor module: Multiple language supports (conta como 0.5 major)

Motivo: Implementar suporte a múltiplos idiomas permite que o ft_transcendence seja acessível para uma audiência global. Django oferece suporte nativo para internacionalização, facilitando a tradução da interface.
Major module: Implement Two-Factor Authentication (2FA) and JWT
Motivo: A segurança é uma prioridade, e a implementação de autenticação em dois fatores (2FA) e o uso de tokens JWT adiciona uma camada extra de proteção para os usuários. Isso garante que os dados dos jogadores e suas contas estejam seguros.
Total:
7 Majors (contando 2 minors como 1 major)