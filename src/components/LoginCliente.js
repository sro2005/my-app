import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginCliente = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isValidEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    if (!isValidEmail(email)) {
      setMessage('Por favor, ingresa un correo electrónico válido.');
      setMessageType('error');
      return;
    }

    const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:5000'; // Asegurarse de que la URL sea HTTPS
    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }

    setLoading(true);

    axios.post(`${API_URL}/api/auth/login`, { email, password })
      .then(response => {
        console.log('Inicio de sesión exitoso:', response.data);
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userData', JSON.stringify(response.data.user)); // Guardar datos del usuario
        console.log('Token almacenado en localStorage:', response.data.token); // Log para depuración
        onLoginSuccess(response.data.user);
        setMessage('Credenciales válidas.');
        setMessageType('success');
        navigate('/home-page');
      })
      .catch(error => {
        console.error('Error en el inicio de sesión:', error);
        setMessage('Credenciales inválidas. Por favor, intenta nuevamente.');
        setMessageType('error');
      })
      .finally(() => {
      setLoading(false);
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
      <button type="submit" disabled={loading}>Ingresar</button>
      {message && (
        <p className={`message ${messageType === 'error' ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
      {loading && <div className="spinner">Cargando...</div>}
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <a href="/recover-password" style={{ color: '#FF6347', textDecoration: 'none' }}>
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>
  );
};

export default LoginCliente;
