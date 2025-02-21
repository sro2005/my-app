import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

const LoginCliente = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { handleLoginSuccess } = useContext(AuthContext);

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!isValidEmail(email)) {
      setMessage('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_BASE_URL;
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password });

      if (data?.token && data?.user) {
        handleLoginSuccess(data.user, data.token);
        setMessage('Inicio de sesión exitoso. Redirigiendo...');
      } else {
        setMessage('Error en la autenticación. Intenta nuevamente.');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Credenciales inválidas. Por favor, intenta nuevamente.');
      setPassword('');
    } finally {
      setLoading(false);
    }
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
      {loading ? (
        <div className="spinner">Cargando...</div>
      ) : (
        message && (
          <p className={`message ${message.includes('error') ? 'error' : 'success'}`}>
            {message}
          </p>
        )
      )}

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <a href="/recover-password" style={{ color: '#FF6347', textDecoration: 'none' }}>
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>
  );
};

export default LoginCliente;