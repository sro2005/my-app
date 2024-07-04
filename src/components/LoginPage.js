import React from 'react';
import LoginCliente from './LoginCliente';
import RegistroCliente from './RegistroCliente';

const LoginPage = ({ onLoginSuccess }) => {
  return (
    <div>
      <h2>Iniciar Sesión</h2>
      <LoginCliente onLoginSuccess={onLoginSuccess} />
      <hr />
      <h2>Registro</h2>
      <RegistroCliente />
    </div>
  );
};

export default LoginPage;
