import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ allowedRoles }) => {
  const userData = JSON.parse(localStorage.getItem('userData'));

  if (!userData) {
    console.error("No se encontraron datos de usuario en localStorage");
    return <Navigate to="/login" replace />;
  }

  if (!userData.role) {
    console.error("No se encontraron roles en los datos de usuario");
    return <Navigate to="/login" replace />;
  }

  // Asegurarse de que el rol del usuario sea una lista
  const userRoles = Array.isArray(userData.role) ? userData.role : [userData.role];

  // Verificar si el usuario tiene algún rol permitido
  const hasAccess = userRoles.some(role => allowedRoles.includes(role));

  if (!hasAccess) {
    console.error("El rol del usuario no está permitido o no es válido");
    return <Navigate to="/home-page" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;


