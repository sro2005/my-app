import React, { createContext, useState, useEffect } from 'react';
import Loading from '../components/Loading';

export const AuthContext = createContext();

const AUTH_STORAGE_KEYS = ['authToken', 'userData', 'userId'];

const clearAuthStorage = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = () => {
    clearAuthStorage();
    setUser(null);
  };

  if (loading) return <Loading />;

  return (
    <AuthContext.Provider value={{ user, handleLoginSuccess, handleLogout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
