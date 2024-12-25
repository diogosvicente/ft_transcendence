import React, { useEffect, useState } from "react";
import Navbar from "../template/Navbar";

const Profile = () => {
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Recupera o email do usuário logado do localStorage
    const storedEmail = localStorage.getItem("email");
    setEmail(storedEmail || "");
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <h1>Perfil</h1>
        {email && <p>Email do usuário: <strong>{email}</strong></p>}
        <p>Detalhes do perfil do usuário aparecerão aqui.</p>
      </div>
    </>
  );
};

export default Profile;
