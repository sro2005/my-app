import React, { createContext, useState, useEffect } from 'react';
import Loading from '../components/Loading';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('userData');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error al parsear los datos del usuario', error);
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user, token) => {
    if (!user?.role || !token) {
      console.error("Error: Datos de usuario o token inválidos");
      return;
    }

    setUser(user);
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
    // Guardamos el userId en localStorage
    if (user._id) {
      localStorage.setItem("userId", user._id.toString());
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('userData', JSON.stringify(updatedUser));
  };  

  const handleLogout = () => {
    localStorage.clear();
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