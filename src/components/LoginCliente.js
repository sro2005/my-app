import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext'; // Ajusta la ruta si es necesario

const LoginCliente = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const { handleLoginSuccess } = useContext(AuthContext);
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

    const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:5000';

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      console.log('Inicio de sesión exitoso:', response.data);
      
      // Guardar datos en localStorage
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      console.log('Token almacenado en localStorage:', response.data.token);

      // Llamar a handleLoginSuccess (para actualizar el estado en AuthContext)
      handleLoginSuccess(response.data.user);

      setMessage('Credenciales válidas.');
      setMessageType('success');

      // Redirigir a la página de inicio (Home Page)
      navigate('/home-page');

    } catch (error) {
      console.error('Error en el inicio de sesión:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Credenciales inválidas. Por favor, intenta nuevamente.');
      }
      setMessageType('error');
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

