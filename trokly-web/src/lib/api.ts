import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("trokly_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("trokly_token");
      // Ne rediriger que si on est sur une page qui nécessite vraiment l'auth
      const publicPaths = ["/", "/login", "/register"];
      const isPublic = publicPaths.includes(window.location.pathname) ||
        window.location.pathname.startsWith("/listings");
      if (!isPublic) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
