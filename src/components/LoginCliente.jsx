import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import FormPage from './FormPage';

const LoginCliente = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState('');
  const [loading, setLoading] = useState(false);
  const { handleLoginSuccess } = useContext(AuthContext);

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageKind('');

    if (!isValidEmail(email)) {
      setMessage('Por favor, ingresa un correo electrónico válido.');
      setMessageKind('error');
      return;
    }

    setLoading(true);

    try {
      const API_URL = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
      if (!API_URL) throw new Error('La conexión no está disponible en este momento.');
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password });

      if (data?.token && data?.user) {
        handleLoginSuccess(data.user, data.token);
        setMessage('Inicio de sesión exitoso. Redirigiendo...');
        setMessageKind('success');
      } else {
        setMessage('Error en la autenticación. Intenta nuevamente.');
        setMessageKind('error');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Credenciales inválidas. Por favor, intenta nuevamente.');
      setMessageKind('error');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage eyebrow="TU ESPACIO CONECTADO" title="Qué bueno verte de nuevo" description="Entra a tu cuenta para seguir con tu hogar a tu manera.">
    <form className="evh-form" onSubmit={handleSubmit}>
      <div className="evh-form-field">
      <label htmlFor="login-email">Correo electrónico</label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        placeholder="nombre@correo.com"
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        required 
      />
      </div>
      <div className="evh-form-field">
      <label htmlFor="login-password">Contraseña</label>
      <input
        id="login-password"
        type="password"
        autoComplete="current-password"
        placeholder="Tu contraseña"
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        required 
      />
      </div>
      <div className="evh-form-options"><Link to="/recover-password">¿Olvidaste tu contraseña?</Link></div>
      <button className="evh-form-submit" type="submit" disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar a mi cuenta'}</button>
      {!loading && message && (
        <p className={`evh-form-feedback is-${messageKind}`} role={messageKind === 'error' ? 'alert' : 'status'}>
          {message}
        </p>
      )}
    </form>
    <p className="evh-form-alternate">¿Primera vez aquí? <Link to="/register">Crea tu cuenta</Link></p>
    </FormPage>
  );
};

export default LoginCliente;
