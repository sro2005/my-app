import React, { useState } from 'react';
import axios from 'axios'; // Importar Axios

const LoginCliente = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // Estado para manejar el mensaje
  const [messageType, setMessageType] = useState(''); // Estado para manejar el tipo de mensaje (éxito o error)

  const handleSubmit = (e) => {
    e.preventDefault();

    // Limpiar mensajes anteriores
    setMessage('');
    setMessageType('');

    // Enviar datos al backend usando Axios
    axios.post('/api/customers/login', { email, password })
      .then(response => {
        console.log('Inicio de sesión exitoso:', response.data);
        localStorage.setItem('authToken', response.data.token); // Guardar solo el token
        onLoginSuccess(); // Llamar al callback para manejar el inicio de sesión exitoso
        setMessage('Credenciales válidas.'); // Mostrar mensaje de éxito
        setMessageType('success'); // Establecer tipo de mensaje a éxito
      })
      .catch(error => {
        console.error('Error en el inicio de sesión:', error);
        setMessage('Credenciales inválidas. Por favor, intenta nuevamente.'); // Mostrar mensaje de error
        setMessageType('error'); // Establecer tipo de mensaje a error
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>INICIAR SESIÓN</h1>
      <h2>Login del Cliente</h2>
      <input
        type="email"
        placeholder="Correo Electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Ingresar</button>
      {message && (
        <p style={{ color: messageType === 'error' ? 'red' : 'green' }}>
          {message}
        </p>
      )} {/* Mostrar mensaje con color basado en el tipo */}
    </form>
  );
};

export default LoginCliente;
