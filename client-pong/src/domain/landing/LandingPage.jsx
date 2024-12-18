import { useState } from "react";
import { Button, Stack, Form, Container, Alert } from "react-bootstrap";
import LoadingModal from "./LoadingModal";

const LoginAndRegisterForm = () => {
  const [validated, setValidated] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState(""); // Armazena mensagens de erro
  const [successMessage, setSuccessMessage] = useState(""); // Armazena mensagens de sucesso

  const handleClose = () => setShowLoading(false);
  const handleShow = () => setShowLoading(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidated(true);
    setErrorMessage(""); // Limpa erros anteriores
    setSuccessMessage(""); // Limpa sucessos anteriores

    handleShow(); // Mostra o modal de loading

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/user-management/register/",
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
        setSuccessMessage("Usuário cadastrado com sucesso!"); // Define mensagem de sucesso
        setErrorMessage(""); // Limpa erro
      } else {
        // Captura a mensagem de erro do backend
        setErrorMessage(data.email ? data.email[0] : "Erro desconhecido.");
        setSuccessMessage(""); // Limpa sucesso
      }
    } catch (error) {
      setErrorMessage("Erro ao conectar ao servidor.");
      setSuccessMessage(""); // Limpa sucesso
    } finally {
      handleClose();
    }
  };

  return (
    <div className="vh-100 d-flex justify-content-center align-items-center">
      <Container className="col-lg-4 border rounded p-4 mx-auto">
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
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

          {/* Campo Senha */}
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

          {/* Exibição de Sucesso */}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          {/* Exibição de Erro */}
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

          {/* Botões */}
          <Stack
            direction="horizontal"
            gap={4}
            className="py-4 d-flex justify-content-center"
          >
            <Button variant="outline-secondary" type="submit" className="w-50">
              Entre
            </Button>
            <Button variant="dark" type="submit" className="w-50">
              Registre-se
            </Button>
          </Stack>
        </Form>
        <LoadingModal showLoading={showLoading} handleClose={handleClose} />
      </Container>
    </div>
  );
};

export default LoginAndRegisterForm;
