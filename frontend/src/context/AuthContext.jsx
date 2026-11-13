import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ── SAS: Active Track State ────────────────────────────────
  // Defaults to nursery_primary, but loads from localStorage if set
  const [activeTrack, setActiveTrack] = useState(
    localStorage.getItem("csn_active_track") || "nursery_primary"
  );

  useEffect(() => {
    const token = localStorage.getItem("csn_token");
    const cachedUser = localStorage.getItem("csn_user");

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

  // ── SAS: Wrapper to update Track and save to storage ───────
  const changeTrack = (track) => {
    setActiveTrack(track);
    localStorage.setItem("csn_active_track", track);
  };

  const login = async (email, password, schoolSlug) => {
    try {
      const response = await api.post("/auth/login", { email, password, schoolSlug });
      
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
    localStorage.removeItem("csn_active_track"); // Clear track on logout
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        setUser, 
        login, 
        logout, 
        loading,
        activeTrack,     // 👈 Exported
        changeTrack      // 👈 Exported
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
