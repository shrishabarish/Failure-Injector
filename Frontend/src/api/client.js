import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:5000/api`;

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { API_BASE_URL };
export default API;
