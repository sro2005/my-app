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

    const API_URL = process.env.REACT_APP_API_BASE_URL;

    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }

    // Enviar datos al backend usando Axios
    axios.post(`https://electrovibehome.up.railway.app/api/customers/login`, { email, password })
      .then(response => {
        console.log('Inicio de sesión exitoso:', response.data);
        localStorage.setItem('authToken', response.data.token); // Guardar solo el token
        localStorage.setItem('userData', JSON.stringify(response.data.user)); // Guarda los datos del cliente
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

      {/* Enlace para "Olvidé mi contraseña" */}
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <a href="/recuperar-contrasena" style={{ color: '#FF6347', textDecoration: 'none' }}>
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>
  );
};

export default LoginCliente;
