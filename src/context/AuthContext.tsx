import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiError, ApiUser, authApi, tokenStore } from '../lib/api';

// Authentication is handled by the backend (JWT). The token is kept in localStorage and
// validated against /users/me on load.

interface AuthResult {
  success: boolean;
  user?: ApiUser;
  message?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: ApiUser | null;
  login: (identifier: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toResult = async (call: () => Promise<{ access_token: string; user: ApiUser }>, setUser: (u: ApiUser) => void) => {
  try {
    const res = await call();
    tokenStore.set(res.access_token);
    setUser(res.user);
    return { success: true, user: res.user };
  } catch (e) {
    return { success: false, message: e instanceof ApiError ? e.message : 'Something went wrong.' };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStore.set(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = (identifier: string, password: string) =>
    toResult(() => authApi.login(identifier.trim(), password), setUser);

  const register = (email: string, password: string) =>
    toResult(() => authApi.register(email.trim(), password), setUser);

  const logout = () => {
    tokenStore.set(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, isLoading, user, login, register, logout }}>
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
