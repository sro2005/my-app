import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ allowedRoles }) => {
  // Obtener los datos del usuario desde localStorage
  const userData = JSON.parse(localStorage.getItem('userData'));

  // Verificar si los datos del usuario están disponibles
  if (!userData) {
    console.error("No se encontraron datos de usuario en localStorage");
    return <Navigate to="/login" replace />;
  }

  // Verificar si el rol del usuario está permitido
  if (!userData.role || 
      (Array.isArray(userData.role) && !userData.role.some(role => allowedRoles.includes(role))) || 
      (!Array.isArray(userData.role) && !allowedRoles.includes(userData.role))) {
    console.error("El rol del usuario no está permitido o no es válido");
    return <Navigate to="/access-denied" replace />;
  }

  // Si el usuario tiene permiso, renderiza los componentes hijos
  return <Outlet />;
};

export default PrivateRoute;
