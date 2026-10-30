import React, { createContext, useState, useEffect, useRef } from 'react';
import Loading from '../components/Loading';

export const AuthContext = createContext();

const AUTH_STORAGE_KEYS = ['authToken', 'userData', 'userId'];

const clearAuthStorage = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutTimerRef = useRef(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('userData');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser === 'object' && parsedUser._id && parsedUser.role) {
          setUser(parsedUser);
        } else {
          clearAuthStorage();
        }
      } catch {
        // Invalid persisted state must not leave a stale token behind.
        clearAuthStorage();
      }
    } else if (storedToken || storedUser || localStorage.getItem('userId')) {
      // Remove partial authentication state without touching unrelated app storage.
      clearAuthStorage();
    }

    setLoading(false);
  }, []);

  const handleLoginSuccess = (user, token) => {
    if (!user?._id || !user?.role || typeof token !== 'string' || !token.trim()) {
      console.error('No se pudo guardar una sesión con datos incompletos.');
      return;
    }

    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('userId', String(user._id));
    setUser(user);
  };

  const updateUser = (updatedUser) => {
    if (!updatedUser || typeof updatedUser !== 'object' || !updatedUser._id) return;
    setUser(updatedUser);
    localStorage.setItem('userData', JSON.stringify(updatedUser));
  };

  useEffect(() => () => {
    if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current);
  }, []);

  const handleLogout = () => {
    clearAuthStorage();
    setUser(null);
    setIsLoggingOut(true);
    if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current);
    logoutTimerRef.current = window.setTimeout(() => {
      setIsLoggingOut(false);
      logoutTimerRef.current = null;
    }, 700);
  };

  if (loading) return <Loading />;
  if (isLoggingOut) {
    return (
      <Loading
        title="Cerrando tu sesión"
        description="Estamos finalizando tu sesión de forma segura."
      />
    );
  }

  return (
    <AuthContext.Provider value={{ user, handleLoginSuccess, handleLogout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
