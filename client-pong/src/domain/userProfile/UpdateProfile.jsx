import React, { useEffect, useState } from "react";
import Navbar from "../template/Navbar";
import API_BASE_URL from "../../assets/config/config";
import "../../assets/styles/profile.css";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const Profile = () => {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Novo: controle se o usuário deseja alterar a senha
  const [updatePassword, setUpdatePassword] = useState(false);
  // Validação dos requisitos de senha forte
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  // Mensagem para feedback de submit (sucesso ou erro)
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    // Recupera o ID do usuário logado do localStorage
    const storedUserId = localStorage.getItem("id");
    if (storedUserId) {
      setUserId(storedUserId);
      const accessToken = localStorage.getItem("access");
      // Busca as informações do usuário utilizando o endpoint "user-info"
      axios
        .get(`${API_BASE_URL}/api/user-management/user-info/${storedUserId}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          const data = response.data;
          setDisplayName(data.display_name || "");
          setEmail(data.email || "");
          // Garante que o estado do 2FA seja sempre booleano
          setIs2FAVerified(
            data.is_2fa_verified !== undefined ? data.is_2fa_verified : false
          );
          // Se houver um avatar, o caminho é precedido pelo API_BASE_URL
          if (data.avatar) {
            setAvatarPreview(`${API_BASE_URL}${data.avatar}`);
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar os dados do usuário:", error);
        });
    }
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const updatePasswordValidation = (value) => {
    setPasswordValidation({
      minLength: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
    });
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    updatePasswordValidation(value);
  };

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  const renderPasswordRequirements = () => (
    <ul className="list-unstyled">
      <li style={{ color: passwordValidation.minLength ? "green" : "red" }}>
        {t("password_requirements.minLength")}
      </li>
      <li style={{ color: passwordValidation.uppercase ? "green" : "red" }}>
        {t("password_requirements.uppercase")}
      </li>
      <li style={{ color: passwordValidation.lowercase ? "green" : "red" }}>
        {t("password_requirements.lowercase")}
      </li>
      <li style={{ color: passwordValidation.number ? "green" : "red" }}>
        {t("password_requirements.number")}
      </li>
      <li style={{ color: passwordValidation.specialChar ? "green" : "red" }}>
        {t("password_requirements.specialChar")}
      </li>
    </ul>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitMessage(""); // Limpa mensagem anterior
    const accessToken = localStorage.getItem("access");
    const formData = new FormData();
    formData.append("display_name", displayName);
    // Apenas envia a senha se o usuário optou por alterá-la
    if (updatePassword) {
      // Verifica se a senha satisfaz os requisitos de senha forte
      const validPassword = Object.values(passwordValidation).every(
        (v) => v === true
      );
      if (!validPassword) {
        setSubmitMessage(t("password_requirements.error"));
        return;
      }
      formData.append("password", password);
    }
    formData.append("is_2fa_verified", is2FAVerified);
    if (avatar) {
      formData.append("avatar", avatar);
    }

    axios
      .patch(
        `${API_BASE_URL}/api/user-management/user-profile/${userId}/`,
        formData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      .then((response) => {
        console.log("Perfil atualizado com sucesso:", response.data);
        setSubmitMessage(t("profile_update_success"));
      })
      .catch((error) => {
        console.error("Erro ao atualizar o perfil:", error);
        setSubmitMessage(t("profile_update_error"));
      });
  };

  return (
    <>
      <Navbar />
      <div className="container-profile mt-5">
        <h4>Atualizar informações do meu perfil</h4>
        {email && (
          <p>
            Email do usuário: <strong>{email}</strong>
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="displayName" className="form-label">
              Nome para exibição
            </label>
            <input
              type="text"
              className="form-control"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          {/* Checkbox para ativar a alteração da senha */}
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="updatePassword"
              checked={updatePassword}
              onChange={(e) => setUpdatePassword(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="updatePassword">
              {t("change_password_label")}
            </label>
          </div>
          {/* Renderiza o campo de senha apenas se o usuário optar por alterá-la */}
          {updatePassword && (
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                {t("password_label")}
              </label>
              <div className="d-flex">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder={t("password_placeholder")}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary ms-2"
                  onClick={handlePasswordToggle}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              {renderPasswordRequirements()}
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="avatar" className="form-label">
              Avatar
            </label>
            <input
              type="file"
              className="form-control"
              id="avatar"
              onChange={handleAvatarChange}
            />
            {avatarPreview && (
              <div className="mt-2">
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  style={{ maxWidth: "150px" }}
                />
              </div>
            )}
          </div>
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="is2FAVerified"
              checked={is2FAVerified}
              onChange={(e) => setIs2FAVerified(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="is2FAVerified">
              Verificação 2FA
            </label>
          </div>
          <button type="submit" className="btn btn-primary">
            Atualizar Perfil
          </button>
          {/* Exibe mensagem de sucesso ou erro */}
          {submitMessage && (
            <div className="mt-3 alert alert-success" role="alert">
              {submitMessage}
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default Profile;
