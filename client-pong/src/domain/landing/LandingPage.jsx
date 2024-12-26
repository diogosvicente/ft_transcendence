import { useState, useEffect } from "react";
import { Button, Stack, Form, Container, Alert, Tabs, Tab } from "react-bootstrap";
import LoadingModal from "./LoadingModal";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API_BASE_URL from "../../assets/config/config.js";
import brazilFlag from "../../assets/icons/brazil-flag-round-circle-icon.svg";
import spainFlag from "../../assets/icons/spain-country-flag-round-icon.svg";
import ukFlag from "../../assets/icons/uk-flag-round-circle-icon.svg";
import "../../assets/styles/landingPage.css";

// ícones
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faSignInAlt, faUserPlus, faKey } from "@fortawesome/free-solid-svg-icons";
import { faTableTennis } from "@fortawesome/free-solid-svg-icons";

const LoginAndRegisterForm = () => {
  const { t, i18n } = useTranslation();
  const [validated, setValidated] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    code: "",
    avatar: null,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("access");
    if (accessToken) {
      navigate("/home");
    }
  }, [navigate]);

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
  };

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  const handleClose = () => setShowLoading(false);
  const handleShow = () => setShowLoading(true);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar") {
      const file = files[0];
      if (file && file.size > 1024 * 1024) {
        setErrorMessage(t("error_avatar_size"));
        setFormData({ ...formData, avatar: null });
      } else {
        setErrorMessage("");
        setFormData({ ...formData, avatar: file });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (name === "password") {
      setPasswordValidation({
        minLength: value.length >= 12,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }
  };

  const isPasswordValid = () => {
    const { minLength, uppercase, lowercase, number, specialChar } = passwordValidation;
    return minLength && uppercase && lowercase && number && specialChar;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setValidated(true);
    setErrorMessage("");
    setSuccessMessage("");

    handleShow();

    try {
      const response = await fetch(`${API_BASE_URL}/api/user-management/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires_2fa) {
          setSuccessMessage(t("2fa_message"));
          setIs2FARequired(true);
        } else {
          setSuccessMessage(t("success_login"));
          localStorage.setItem("access", data.access);
          localStorage.setItem("refresh", data.refresh);
          localStorage.setItem("email", formData.email);
          navigate("/home");
        }
      } else {
        setErrorMessage(data.error || t("error_invalid_credentials"));
      }
    } catch (error) {
      setErrorMessage(t("error_connection"));
    } finally {
      handleClose();
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setValidated(true);
    setErrorMessage("");
    setSuccessMessage("");

    // Validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Por favor, insira um e-mail válido.");
      return;
    }

    // Validação de senha forte
    if (!isPasswordValid()) {
      setErrorMessage("Por favor, preencha os requisitos de senha antes de continuar.");
      return;
    }

    handleShow();

    const formDataToSend = new FormData();
    formDataToSend.append("email", formData.email);
    formDataToSend.append("password", formData.password);
    if (formData.avatar) {
      formDataToSend.append("avatar", formData.avatar);
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user-management/register/`,
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Usuário cadastrado com sucesso!");
        setActiveTab("login");
      } else {
        setErrorMessage(data.email ? data.email[0] : "Erro desconhecido.");
      }
    } catch (error) {
      setErrorMessage("Erro ao conectar ao servidor.");
    } finally {
      handleClose();
    }
  };

  const handleValidate2FA = async (event) => {
    event.preventDefault();
    setValidated(true);
    setErrorMessage("");
    setSuccessMessage("");

    handleShow();

    try {
      const response = await fetch(`${API_BASE_URL}/api/user-management/2fa/validate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(t("success_2fa"));
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("email", formData.email);
        navigate("/home");
      } else {
        setErrorMessage(data.error || t("error_invalid_2fa"));
      }
    } catch (error) {
      setErrorMessage(t("error_connection"));
    } finally {
      handleClose();
    }
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

  return (
    <div className="vh-100 d-flex flex-column justify-content-center align-items-center">
      {/* Language Selector */}
      <div className="language-selector position-absolute top-0 end-0 mt-3 me-3">
        <div className="d-flex gap-3">
          <div
            className="language-card"
            onClick={() => handleLanguageChange("pt_BR")}
          >
            <img
              src={brazilFlag}
              alt="Português (Brasil)"
              className="language-flag"
            />
            <span className="language-text">PT-BR</span>
          </div>
          <div
            className="language-card"
            onClick={() => handleLanguageChange("en")}
          >
            <img
              src={ukFlag}
              alt="English"
              className="language-flag"
            />
            <span className="language-text">EN</span>
          </div>
          <div
            className="language-card"
            onClick={() => handleLanguageChange("es")}
          >
            <img
              src={spainFlag}
              alt="Español"
              className="language-flag"
            />
            <span className="language-text">ES</span>
          </div>
        </div>
      </div>

      <h1 className="mb-4 d-flex align-items-center justify-content-center">
        <FontAwesomeIcon icon={faTableTennis} className="me-3" />
        {t("app_title")}
      </h1>
      <Container className="col-lg-4 border rounded p-4 mx-auto">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3 custom-tabs"
        >
          <Tab
            eventKey="login"
            title={
              <span>
                <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                {t("login")}
              </span>
            }
          >
            <Form noValidate validated={validated}>
              <Form.Group className="mb-3" controlId={`formBasicEmail-${activeTab}`}>
                <Form.Label>{t("email_label")}</Form.Label>
                <Form.Control
                  required
                  type="text"
                  placeholder={t("email_placeholder")}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Form.Control.Feedback type="invalid">
                  {t("required_field")}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group
                className="mb-3 position-relative"
                controlId={`formBasicPassword-${activeTab}`}
              >
                <Form.Label>{t("password_label")}</Form.Label>
                <div className="d-flex">
                  <Form.Control
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder={t("password_placeholder")}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <Button
                    variant="outline-secondary"
                    className="ms-2"
                    onClick={handlePasswordToggle}
                  >
                    <FontAwesomeIcon
                      icon={showPassword ? faEyeSlash : faEye}
                    />
                  </Button>
                </div>
                <Form.Control.Feedback type="invalid">
                  {t("required_field")}
                </Form.Control.Feedback>
              </Form.Group>

              {is2FARequired && (
                <Form.Group className="mb-3" controlId={`form2FACode-${activeTab}`}>
                  <Form.Label>{t("2fa_code_label")}</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    placeholder={t("code_2fa_placeholder")}
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {t("required_field")}
                  </Form.Control.Feedback>
                </Form.Group>
              )}

              {successMessage && (
                <Alert variant="success">{successMessage}</Alert>
              )}
              {errorMessage && (
                <Alert variant="danger">{errorMessage}</Alert>
              )}

              <Stack
                direction="horizontal"
                gap={4}
                className="py-4 d-flex justify-content-center"
              >
                {is2FARequired ? (
                  <Button
                    variant="dark"
                    className="w-50"
                    onClick={handleValidate2FA}
                  >
                    <FontAwesomeIcon icon={faKey} className="me-2" />
                    {t("validate_code")}
                  </Button>
                ) : (
                  <Button
                    variant="outline-secondary"
                    className="w-50"
                    onClick={handleLogin}
                  >
                    <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                    {t("login")}
                  </Button>
                )}
              </Stack>
            </Form>

          </Tab>

          <Tab
            eventKey="register"
            title={
              <span>
                <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                {t("register")}
              </span>
            }
          >
            <Form noValidate validated={validated}>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>{t("email_label")}</Form.Label>
                <Form.Control
                  required
                  type="text"
                  placeholder={t("email_placeholder")}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Form.Control.Feedback type="invalid">
                  {t("required_field")}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>{t("password_label")}</Form.Label>
                <Form.Control
                  required
                  type="password"
                  placeholder={t("password_placeholder")}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <Form.Control.Feedback type="invalid">
                  {t("required_field")}
                </Form.Control.Feedback>
                {renderPasswordRequirements()}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formAvatar">
                <Form.Label>{t("avatar_label")}</Form.Label>
                <Form.Control
                  type="file"
                  name="avatar"
                  accept=".jpg,.png"
                  onChange={handleChange}
                />
                <Form.Text className="text-muted">
                  {t("avatar_info")}
                </Form.Text>
              </Form.Group>

              {successMessage && (
                <Alert variant="success">{successMessage}</Alert>
              )}
              {errorMessage && (
                <Alert variant="danger">{errorMessage}</Alert>
              )}

              <Stack
                direction="horizontal"
                gap={4}
                className="py-4 d-flex justify-content-center"
              >
                <Button
                  variant="dark"
                  className="w-50"
                  onClick={handleRegister}
                >
                  <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                  {t("register")}
                </Button>
              </Stack>
            </Form>
          </Tab>
        </Tabs>
        <LoadingModal showLoading={showLoading} handleClose={handleClose} />
      </Container>
    </div>
  );
};

export default LoginAndRegisterForm;
