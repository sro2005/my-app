// AccessDenied.js
import React from 'react';
import { Link } from 'react-router-dom'; // Para redirigir al usuario a otra página (como inicio de sesión)

const AccessDenied = () => {
  return (
    <div className="access-denied">
      <h1>Acceso Denegado</h1>
      <p>No tienes permiso para acceder a esta página.</p>
      <p>Si crees que esto es un error, por favor contacta con el administrador.</p>
      {/* Opción para redirigir al login */}
      <Link to="/login">Volver al Login</Link>
    </div>
  );
};

export default AccessDenied;
