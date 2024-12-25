import React, { useEffect, useState } from "react";
import Navbar from "../template/Navbar";

const Home = () => {
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Recupera o email do usuário logado do localStorage
    const storedEmail = localStorage.getItem("email");
    setEmail(storedEmail || ""); // Define o email ou uma string vazia caso não exista
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <h1>Bem-vindo à Página Inicial!</h1>
        {/* Exibe o email do usuário logado */}
        {email && <p>Email do usuário logado: <strong>{email}</strong></p>}
        <p>Conteúdo da página inicial vai aqui.</p>
      </div>
    </>
  );
};

export default Home;
