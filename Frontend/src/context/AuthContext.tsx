import React, { createContext, useContext, useState, useEffect } from "react";
import client from "../Services/clientServices"; // IMPORTANT

export interface UserType {
  username: string;
  id: number;
  name: string;
  email: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: UserType | null;
  loading: boolean;
  login: (user: UserType, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        if (parsedUser && parsedUser.id) {
          setIsAuthenticated(true);
          setUser(parsedUser);

          client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("AUTH RESTORE ERROR ⇒ ", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  const login = (userData: UserType, token: string) => {
    setIsAuthenticated(true);
    setUser(userData);

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    delete client.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
