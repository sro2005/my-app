// src/components/LoginCliente.js
import React, { useState } from 'react';
import axios from 'axios'; // Importar Axios

const LoginCliente = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Enviar datos al backend usando Axios
    axios.post('/api/customers/login', {
      email,
      password
    })
    .then(response => {
      console.log('Inicio de sesión exitoso:', response.data);
      // Llamar a la función onLoginSuccess si la autenticación es exitosa
      onLoginSuccess();
      alert('Credenciales válidas.');
    })
    .catch(error => {
      console.error('Error en el inicio de sesión:', error);
      alert('Credenciales inválidas. Por favor, intenta nuevamente.');
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>INICIAR SESIÓN</h1>
      <h2>Login del Cliente</h2>
      <input
        type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input
        type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Ingresar</button>
    </form>
  );
};

export default LoginCliente;
