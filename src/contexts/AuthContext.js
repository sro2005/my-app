import React, { createContext, useState, useEffect } from 'react';
import Loading from '../components/Loading';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = JSON.parse(localStorage.getItem('userData'));
    const storedRole = localStorage.getItem('userRole');

    if (storedToken && storedUser && storedRole) {
      setUser(storedUser);
      setToken(storedToken); // Almacenar también el token
      setUserRole(storedRole); // Almacenar el rol
    }

    setLoading(false); // Detener el loading después de la verificación
  }, []);

  const handleLoginSuccess = (user, token, role) => {
    setUser(user);
    setToken(token); // Establecer el token en el estado
    setUserRole(role); // Establecer el rol en el estado
    localStorage.setItem('authToken', token); // Guardar el token en localStorage
    localStorage.setItem('userData', JSON.stringify(user)); // Guardar los datos del usuario
    localStorage.setItem('userRole', role); // Guardar el rol en localStorage
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole'); // Eliminar el rol al hacer logout
    setUser(null);
    setToken(null); // Limpiar el token al hacer logout
    setUserRole(null); // Limpiar el rol
  };

  if (loading) {
    return <Loading />; // Mostrar el componente de carga mientras se verifica el estado de autenticación
  }

  return (
    <AuthContext.Provider value={{ user, token, userRole, handleLoginSuccess, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;


