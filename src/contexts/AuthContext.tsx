import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'coordinator' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('clus_user');
    const storedToken = localStorage.getItem('clus_token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        localStorage.removeItem('clus_user');
        localStorage.removeItem('clus_token');
        setUser(null);
        setToken(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server is offline or returned an invalid response.");
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('clus_user', JSON.stringify(data.user));
      localStorage.setItem('clus_token', data.token);
    } catch (err: any) {
      throw new Error(err.message || "Failed to connect to the server.");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('clus_user');
    localStorage.removeItem('clus_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

