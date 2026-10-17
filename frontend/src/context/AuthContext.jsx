import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("csn_token");
    const cachedUser = localStorage.getItem("csn_user");

    // Load user from cache instantly so they don't get kicked out on refresh
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        localStorage.removeItem("csn_user");
      }
    }

    if (!token) {
      setLoading(false);
      return;
    }

    // Verify token with backend
    api.get("/auth/me")
      .then(({ data }) => {
        setUser(data.data.user);
        localStorage.setItem("csn_user", JSON.stringify(data.data.user));
      })
      .catch(() => {
        localStorage.removeItem("csn_token");
        localStorage.removeItem("csn_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, schoolSlug) => {
  try {
    const response = await api.post("/auth/login", { email, password, schoolSlug });
    
    // Debugging: Let's see exactly what the backend sent back
    console.log("BACKEND RESPONSE:", response.data);

    // The backend wraps the token inside response.data.data
    const backendData = response.data.data; 

    if (!backendData || !backendData.token) {
      throw new Error("Token missing from backend response");
    }

    localStorage.setItem("csn_token", backendData.token);
    localStorage.setItem("csn_user", JSON.stringify(backendData.user));
    setUser(backendData.user);
    return backendData.user;

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    throw err;
  }
};

  const logout = () => {
    localStorage.removeItem("csn_token");
    localStorage.removeItem("csn_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
