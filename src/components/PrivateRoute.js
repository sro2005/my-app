import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ allowedRoles }) => {
  const userData = JSON.parse(localStorage.getItem('userData'));

  // Verificar si los datos del usuario están disponibles
  if (!userData) {
    console.error("No se encontraron datos de usuario en localStorage");
    return <Navigate to="/login" replace />;
  }

  // Verifica si el rol del usuario está permitido
  if (!userData.role || !allowedRoles.includes(userData.role)) {
    console.error("El rol del usuario no está permitido");
    return <Navigate to="/login" replace />;
  }

  // Si el usuario tiene permiso, renderiza los componentes hijos
  return <Outlet />;
};

export default PrivateRoute;

