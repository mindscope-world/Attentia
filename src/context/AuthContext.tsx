import React, { createContext, useContext, useState } from 'react';

// Hardcoded demo credentials. This app has no backend, so authentication
// is enforced entirely on the client against this single account.
const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'qwerty1life';

const AUTH_STORAGE_KEY = 'attentia_auth_session';

interface AuthUser {
  username: string;
  email: string;
}

interface LoginResult {
  success: boolean;
  user?: AuthUser;
  message?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (identifier: string, password: string) => LoginResult;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const login = (identifierRaw: string, password: string): LoginResult => {
    const identifier = identifierRaw.trim().toLowerCase();
    const isKnownIdentity = identifier === ADMIN_USERNAME || identifier === ADMIN_EMAIL;

    if (!isKnownIdentity || password !== ADMIN_PASSWORD) {
      return { success: false, message: 'Invalid username/email or password.' };
    }

    const authUser: AuthUser = { username: ADMIN_USERNAME, email: ADMIN_EMAIL };
    setUser(authUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    } catch {
      // Ignore storage failures (private browsing, storage disabled, etc.)
    }
    return { success: true, user: authUser };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
