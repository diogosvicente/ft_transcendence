import React, { useEffect, useState } from "react";
import Navbar from "../template/Navbar"; // Importa o Navbar
import axios from "axios"; // Para requisições HTTP
import "../../assets/styles/chat.css"; // Importa o CSS do chat

const Chat = () => {
    const [users, setUsers] = useState([]); // Estado para armazenar os usuários
    const [error, setError] = useState(null); // Estado para erros

    useEffect(() => {
        const fetchUsers = async () => {
            // Obtém o token do localStorage
            const accessToken = localStorage.getItem("access");
            if (!accessToken) {
                console.error("Access token não encontrado.");
                setError("Access token não encontrado.");
                return;
            }

            try {
                // Faz a requisição para buscar os usuários
                const response = await axios.get(
                    "http://127.0.0.1:8000/api/user-management/users/exclude-self/",
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`, // Insere o token no cabeçalho
                        },
                    }
                );

                setUsers(response.data.users); // Atualiza o estado com os usuários
            } catch (err) {
                console.error("Erro ao buscar lista de usuários:", err);
                setError("Erro ao buscar lista de usuários.");
            }
        };

        fetchUsers(); // Chama a função ao carregar o componente
    }, []);

    return (
        <>
            <Navbar />
            <div className="container mt-5">
                <h1>Chat</h1>
                {error && <p className="text-danger">{error}</p>}
                {users.length > 0 ? (
                    <ul>
                        {users.map((user) => (
                            <li key={user.id}>
                                <strong>{user.display_name}</strong>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Nenhum usuário encontrado.</p>
                )}
            </div>
        </>
    );
};

export default Chat;
