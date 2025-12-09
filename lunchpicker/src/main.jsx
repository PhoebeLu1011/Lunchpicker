// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter } from "react-router-dom";   
import { LunchProvider } from "./context/LunchContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>         
      <AuthProvider>
        <LunchProvider>
          <App />
        </LunchProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
