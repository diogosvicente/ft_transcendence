import { useState } from "react";
import { Button, Stack, Form, Container, Row, Col } from "react-bootstrap";

import LoadingModal from "./LoadingModal";

const LandingPage = () => {
  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <Col style={{ minHeight: "75vh" }}>
        <Header />
        <LoginAndRegisterForm />
      </Col>
    </Container>
  );
};

const Header = () => {
  return (
    <Col className="p-3 text-center">
      <Row>
        <h1>Pong</h1>
      </Row>
      <Row>
        <p className="fs-4 fw-light">Jogue online com seus amigos!</p>
      </Row>
    </Col>
  );
};

const LoginAndRegisterForm = () => {
  const [validated, setValidated] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const handleClose = () => setShowLoading(false);
  const handleShow = () => setShowLoading(true);

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }
    handleShow();
    setValidated(true);
  };

  return (
    <Container className="col-lg-4 border rounded p-4 mx-auto">
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Nick</Form.Label>
          <Form.Control required type="text" placeholder="Digite seu nick" />
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
          />
          <Form.Control.Feedback type="invalid">
            Campo obrigatório.
          </Form.Control.Feedback>
        </Form.Group>

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
  );
};

export default LandingPage;
