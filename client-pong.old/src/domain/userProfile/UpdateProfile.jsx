import React, { useEffect, useState, useRef } from "react";
import Navbar from "../template/Navbar";
import API_BASE_URL from "../../assets/config/config";
import "../../assets/styles/profile.css";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faFile, faFileUpload, faTimes } from "@fortawesome/free-solid-svg-icons";

const Profile = () => {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [displayNameExists, setDisplayNameExists] = useState(false);
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [updatePassword, setUpdatePassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  const [submitMessage, setSubmitMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);
  const accessToken = localStorage.getItem("access");

  useEffect(() => {
    const storedUserId = localStorage.getItem("id");
    if (storedUserId) {
      setUserId(storedUserId);
      axios
        .get(`${API_BASE_URL}/api/user-management/user-info/${storedUserId}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          const data = response.data;
          setDisplayName(data.display_name || "");
          setEmail(data.email || "");
          setIs2FAVerified(data.is_2fa_verified !== undefined ? data.is_2fa_verified : false);
          if (data.avatar) {
            setAvatarPreview(`${API_BASE_URL}${data.avatar}`);
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar os dados do usuário:", error);
        });
    }
  }, [accessToken]);
  
  const checkDisplayNameAvailability = async (name) => {
    if (!name.trim()) {
      setDisplayNameExists(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user-management/check-display-name/${name}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setDisplayNameExists(response.data.exists);
    } catch (error) {
      console.error("Erro ao verificar o display_name:", error);
    }
  };

  const handleDisplayNameChange = (e) => {
    const newName = e.target.value;
    setDisplayName(newName);
    checkDisplayNameAvailability(newName);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 1024 * 1024) {
      setErrorMessage(t("error_avatar_size"));
      setAvatar(null);
    } else {
      setErrorMessage("");
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarRemove = () => {
    setAvatar(null);
    setAvatarPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
    setSubmitMessage("");
    setErrorMessage("");

    if (!displayName.trim()) {
      setErrorMessage(t("update_userprofile.display_name_required"));
      return;
    }

    if (displayNameExists) {
      setErrorMessage(t("update_userprofile.display_name_exists"));
      return;
    }

    const formData = new FormData();
    formData.append("display_name", displayName);

    if (updatePassword) {
      const validPassword = Object.values(passwordValidation).every((v) => v === true);
      if (!validPassword) {
        setErrorMessage(t("error_password_requirements"));
        return;
      }
      formData.append("password", password);
    }

    formData.append("is_2fa_verified", is2FAVerified);
    if (avatar) {
      formData.append("avatar", avatar);
    }

    axios
      .patch(`${API_BASE_URL}/api/user-management/user-profile/${userId}/`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then(() => {
        setSubmitMessage(t("update_userprofile.profile_update_success"));
      })
      .catch(() => {
        setErrorMessage(t("update_userprofile.profile_update_error"));
      });
  };

  return (
    <>
      <Navbar />
      <div className="container-profile mt-5">
        <h4>{t("update_userprofile.title")}</h4>
        
        {email && (
          <p>
            {t("update_userprofile.email_label")}: <strong>{email}</strong>
          </p>
        )}
  
        <form onSubmit={handleSubmit}>
          {/* Nome de Exibição */}
          <div className="mb-3">
            <label className="form-label">{t("update_userprofile.display_name")}</label>
            <input
              type="text"
              className={`form-control ${displayNameExists ? "is-invalid" : ""}`}
              value={displayName}
              onChange={handleDisplayNameChange}
              aria-invalid={displayNameExists ? "true" : "false"}
            />
            {displayNameExists && (
              <div className="invalid-feedback">{t("update_userprofile.display_name_exists")}</div>
            )}
          </div>
  
          {/* Mensagem de erro geral */}
          {errorMessage && <p className="text-danger">{errorMessage}</p>}
  
          {/* Checkbox para alterar a senha */}
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="updatePassword"
              checked={updatePassword}
              onChange={(e) => setUpdatePassword(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="updatePassword">
              {t("update_userprofile.change_password_label")}
            </label>
          </div>
  
          {/* Campo de Senha - apenas se "Alterar Senha" estiver marcado */}
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
  
          {/* Campo de Avatar */}
          <div className="mb-3">
            <label className="form-label">{t("avatar_label")}</label>
            <div className="d-flex align-items-center">
              <label htmlFor="fileInput" className="btn btn-outline-secondary w-100">
                <FontAwesomeIcon icon={avatar ? faFile : faFileUpload} className="me-2" />
                {avatar ? avatar.name : t("choose_file")}
              </label>
              <input
                id="fileInput"
                ref={fileInputRef}
                type="file"
                accept=".jpg,.png"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
              {avatar && (
                <button type="button" className="btn btn-outline-danger ms-2" onClick={handleAvatarRemove}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>
            {avatarPreview && (
              <img src={avatarPreview} alt="Avatar Preview" style={{ maxWidth: "150px", marginTop: "10px" }} />
            )}
          </div>
  
          {/* Checkbox para Ativar/Desativar 2FA */}
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="is2FAVerified"
              checked={is2FAVerified}
              onChange={(e) => setIs2FAVerified(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="is2FAVerified">
              {t("update_userprofile.2fa_label")}
            </label>
          </div>
  
          {/* Botão de Atualizar */}
          <button type="submit" className="btn btn-primary" disabled={displayNameExists}>
            {t("update_userprofile.update_button")}
          </button>
  
          {/* Mensagem de Sucesso */}
          {submitMessage && <div className="mt-3 alert alert-success">{submitMessage}</div>}
        </form>
      </div>
    </>
  );
};

export default Profile;
