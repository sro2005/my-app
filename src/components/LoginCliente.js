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
      // Obtener el rol del usuario desde la respuesta
      const userRole = response.data.role; 
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userRole', userRole);
      onLoginSuccess(userRole); // Pasar el rol al callback
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
