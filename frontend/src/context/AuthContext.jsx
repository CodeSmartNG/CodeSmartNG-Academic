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
    const { data } = await api.post("/auth/login", { email, password, schoolSlug });
    
    // 👇 FIXED: Access the nested data correctly
    const { token, user: loggedInUser } = data.data;

    localStorage.setItem("csn_token", token);
    localStorage.setItem("csn_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
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
