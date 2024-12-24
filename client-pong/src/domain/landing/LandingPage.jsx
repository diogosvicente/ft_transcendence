import { useState, useEffect } from "react";
import { Button, Stack, Form, Container, Alert, Tabs, Tab } from "react-bootstrap";
import LoadingModal from "./LoadingModal";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../config/config.js";  // Importando a URL da API

const LoginAndRegisterForm = () => {
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
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("access");
    if (accessToken) {
      navigate("/home");
    }
  }, [navigate]);

  const handleClose = () => setShowLoading(false);
  const handleShow = () => setShowLoading(true);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar") {
      const file = files[0];
      if (file && file.size > 1024 * 1024) {
        setErrorMessage("O arquivo deve ter no máximo 1MB.");
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

  const handleLogin = async (event) => {
    event.preventDefault();
    setValidated(true);
    setErrorMessage("");
    setSuccessMessage("");

    handleShow();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user-management/login/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.requires_2fa) {
          setSuccessMessage("Código 2FA enviado para o e-mail. Insira o código para continuar.");
          setIs2FARequired(true);
        } else {
          setSuccessMessage("Login realizado com sucesso!");
          localStorage.setItem("access", data.access);
          localStorage.setItem("refresh", data.refresh);
          localStorage.setItem("email", formData.email);
          navigate("/home");
        }
      } else {
        setErrorMessage(data.error || "Credenciais inválidas.");
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
      const response = await fetch(
        `${API_BASE_URL}/api/user-management/2fa/validate/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            code: formData.code,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Login realizado com sucesso! Você foi autenticado com 2FA.");
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("email", formData.email);
        navigate("/home");
      } else {
        setErrorMessage(data.error || "Código inválido ou expirado.");
      }
    } catch (error) {
      setErrorMessage("Erro ao conectar ao servidor.");
    } finally {
      handleClose();
    }
  };

  const renderPasswordRequirements = () => (
    <ul className="list-unstyled">
      <li style={{ color: passwordValidation.minLength ? "green" : "red" }}>
        Deve ter pelo menos 12 caracteres
      </li>
      <li style={{ color: passwordValidation.uppercase ? "green" : "red" }}>
        Deve conter pelo menos uma letra maiúscula
      </li>
      <li style={{ color: passwordValidation.lowercase ? "green" : "red" }}>
        Deve conter pelo menos uma letra minúscula
      </li>
      <li style={{ color: passwordValidation.number ? "green" : "red" }}>
        Deve conter pelo menos um número
      </li>
      <li style={{ color: passwordValidation.specialChar ? "green" : "red" }}>
        Deve conter pelo menos um caractere especial (!@#$%^&*)
      </li>
    </ul>
  );

  return (
    <div className="vh-100 d-flex flex-column justify-content-center align-items-center">
      <h1 className="mb-4">PONG GAME</h1>
      <Container className="col-lg-4 border rounded p-4 mx-auto">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="login" title="Login">
            <Form noValidate validated={validated}>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>E-mail</Form.Label>
                <Form.Control
                  required
                  type="text"
                  placeholder="Digite seu e-mail"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Form.Control.Feedback type="invalid">
                  Campo obrigatório.
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Senha</Form.Label>
                <Form.Control
                  required
                  type="password"
                  placeholder="Digite sua senha"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <Form.Control.Feedback type="invalid">
                  Campo obrigatório.
                </Form.Control.Feedback>
              </Form.Group>

              {is2FARequired && (
                <Form.Group className="mb-3" controlId="form2FACode">
                  <Form.Label>Código 2FA</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    placeholder="Digite o código enviado ao e-mail"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    Campo obrigatório.
                  </Form.Control.Feedback>
                </Form.Group>
              )}

              {successMessage && (
                <Alert variant="success">{successMessage}</Alert>
              )}
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

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
                    Validar Código
                  </Button>
                ) : (
                  <Button
                    variant="outline-secondary"
                    className="w-50"
                    onClick={handleLogin}
                  >
                    Entrar
                  </Button>
                )}
              </Stack>
            </Form>
          </Tab>

          <Tab eventKey="register" title="Registrar">
            <Form noValidate validated={validated}>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>E-mail</Form.Label>
                <Form.Control
                  required
                  type="text"
                  placeholder="Digite seu e-mail"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Form.Control.Feedback type="invalid">
                  Campo obrigatório.
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Senha</Form.Label>
                <Form.Control
                  required
                  type="password"
                  placeholder="Digite sua senha"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <Form.Control.Feedback type="invalid">
                  Campo obrigatório.
                </Form.Control.Feedback>
                {renderPasswordRequirements()}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formAvatar">
                <Form.Label>Avatar (opcional)</Form.Label>
                <Form.Control
                  type="file"
                  name="avatar"
                  accept=".jpg,.png"
                  onChange={handleChange}
                />
                <Form.Text className="text-muted">
                  O arquivo deve ser no formato JPG ou PNG e ter no máximo 1MB.
                </Form.Text>
              </Form.Group>

              {successMessage && (
                <Alert variant="success">{successMessage}</Alert>
              )}
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

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
                  Registrar
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