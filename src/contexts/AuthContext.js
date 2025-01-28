import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import Loading from '../components/Loading';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Para controlar el estado de carga mientras se verifica el token

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    // Simular un retraso en la carga
    setTimeout(() => {
      if (token) {
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        // Opcional: verificar la validez del token (ejemplo con axios)
        axios.post('/api/verify-token', { token }) // Asegúrate de tener una ruta que valide el token en tu backend
          .then((response) => {
            if (response.data.isValid) {
              setUser(userData);
            } else {
              handleLogout(); // Si el token no es válido, hacer logout
            }
          })
          .catch(() => {
            handleLogout(); // Si la verificación falla, hacer logout
          });
      } else {
        setLoading(false);
      }
    }, 1000); // Aquí se puede ajustar el tiempo que se mantendrá el loading (en milisegundos)
  }, []);

  const handleLoginSuccess = (user) => {
    setUser(user);
    localStorage.setItem('authToken', user.token);
    localStorage.setItem('userData', JSON.stringify(user));
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
