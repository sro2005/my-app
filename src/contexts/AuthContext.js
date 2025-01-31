import React, { createContext, useState, useEffect } from 'react';
import Loading from '../components/Loading';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null); // Cambiado de "guest" a null

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('userData');

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setToken(storedToken);
      setUserRole(parsedUser?.role || null); // En caso de que no haya rol, se mantiene null
    }

    setLoading(false);
  }, []);

  const handleLoginSuccess = (user, token) => {
    if (!user?.role || !token) {
      console.error("Error: Datos de usuario o token inválidos");
      return;
    }

    setUser(user);
    setToken(token);
    setUserRole(user.role);

    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    setUserRole(null);
  };

  if (loading) return <Loading />;

  return (
    <AuthContext.Provider value={{ user, token, userRole, handleLoginSuccess, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

