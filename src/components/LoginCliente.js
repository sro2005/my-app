import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginCliente = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState(''); // Parte inicial del correo antes del @
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false); // Estado para manejar el estado de carga
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    const API_URL = process.env.REACT_APP_API_BASE_URL;
    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }

    setLoading(true); // Mostrar spinner de carga

    axios.post(`${API_URL}/api/customers/login`, { email, password })
      .then(response => {
        console.log('Inicio de sesión exitoso:', response.data);
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        onLoginSuccess();
        setMessage('Credenciales válidas.');
        setMessageType('success');
        navigate('/home-page');
      })
      .catch(error => {
        console.error('Error en el inicio de sesión:', error);
        setMessage('Credenciales inválidas. Por favor, intenta nuevamente.');
        setMessageType('error');
      })
      .finally(() => setLoading(false)); // Ocultar spinner de carga
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>INICIAR SESIÓN</h1>
      <h2>Login del Cliente</h2>
      <input type="text" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required  /> 
      <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit" disabled={loading}>Ingresar</button> {/* Deshabilitar botón durante la carga */}
      {message && (
        <p className={`message ${messageType === 'error' ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
      {loading && <div className="spinner">Cargando...</div>} {/* Mostrar spinner de carga */}
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <a href="/recover-password" style={{ color: '#FF6347', textDecoration: 'none' }}>
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>
  );
};

export default LoginCliente;
