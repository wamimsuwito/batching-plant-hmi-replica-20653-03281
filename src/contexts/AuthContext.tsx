import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: () => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded users for offline mode
const USERS = [
  { email: 'admin', password: 'admin', role: 'admin' as const, name: 'Administrator' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = localStorage.getItem('hmi_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simple offline authentication
    const foundUser = USERS.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const userData = { email: foundUser.email, role: foundUser.role, name: foundUser.name };
      setUser(userData);
      localStorage.setItem('hmi_user', JSON.stringify(userData));
      return { success: true };
    }
    
    return { success: false, error: 'Username atau password salah' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hmi_user');
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAdmin,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
