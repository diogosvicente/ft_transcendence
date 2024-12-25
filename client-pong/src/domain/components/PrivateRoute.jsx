import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("access"); // Verifica se o usuário está autenticado

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
