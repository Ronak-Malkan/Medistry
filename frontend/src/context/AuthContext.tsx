import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface UserInfo {
  userId: number;
  accountId: number;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: UserInfo | null;
  loading: boolean;
  login: (jwt: string) => Promise<void>;
  logout: () => void;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("medistry_jwt")
  );
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Validate token and fetch user info
  const validateToken = async (): Promise<boolean> => {
    if (!token) {
      setUser(null);
      return false;
    }
    setLoading(true);
    try {
      const res = await fetch("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Invalid token");
      const data = await res.json();
      setUser(data.user);
      return true;
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem("medistry_jwt");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // On login, store token and fetch user info
  const login = async (jwt: string) => {
    setToken(jwt);
    localStorage.setItem("medistry_jwt", jwt);
    await validateToken();
  };

  // On logout, clear everything
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("medistry_jwt");
  };

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, logout, validateToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}
