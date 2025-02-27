import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { WebSocketProvider } from "./domain/webSocket/WebSocketProvider"; // Importa o Provider
import App from "./App";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <WebSocketProvider>
      <App />
    </WebSocketProvider>
  </BrowserRouter>
);