import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage.jsx";
import { GameCanvas } from "./pages/game/GameCanvas.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/game",
    element: <GameCanvas />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode cl>
    <RouterProvider router={router} />
  </StrictMode>
);
