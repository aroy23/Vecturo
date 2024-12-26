import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import axios from "axios";
import "./styles/index.css";

axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";
axios.defaults.headers.common["Content-Type"] = "application/json";

// Add auth token to requests if available
axios.interceptors.request.use(function (config) {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
