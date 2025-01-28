import React, { createContext, useState, useEffect } from 'react';
import Loading from '../components/Loading';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (token) {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (userData) {
        setUser(userData); // Si el usuario está en localStorage, se establece
      }
    }

    // Para detener el loading después de la verificación
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setUser(user);
    localStorage.setItem('authToken', user.token);
    localStorage.setItem('userData', JSON.stringify(user)); // Asegúrate de que el objeto user tenga un campo 'role'
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  if (loading) {
    return <Loading />; // Mostrar el componente de carga mientras se verifica el estado de autenticación
  }

  return (
    <AuthContext.Provider value={{ user, handleLoginSuccess, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

