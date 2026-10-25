import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import FormPage from './FormPage';

const RECOVERY_REQUEST_TIMEOUT_MS = 15000;

const RecoverPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const apiUrl = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
    if (!apiUrl) {
      setMessage('La recuperación no está disponible en este momento. Intenta nuevamente más tarde.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        apiUrl + '/api/customers/forgot-password',
        { email },
        { timeout: RECOVERY_REQUEST_TIMEOUT_MS }
      );
      setMessage(response.data.message || 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.');
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || 'Ocurrió un error inesperado.');
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        setMessage('La solicitud tardó demasiado. No pudimos confirmar el envío. Inténtalo nuevamente más tarde.');
      } else {
        setMessage('No pudimos conectar con el servicio de recuperación. Verifica tu conexión o inténtalo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage eyebrow="RECUPERA EL ACCESO" title="Volvamos a conectarte" description="Te enviaremos un enlace seguro para que puedas crear una nueva contraseña.">
      <form className="evh-form" onSubmit={handleSubmit} aria-busy={loading}>
        <div className="evh-form-field">
          <label htmlFor="recover-email">Correo electrónico</label>
          <input
            id="recover-email"
            type="email"
            autoComplete="email"
            placeholder="nombre@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button className="evh-form-submit" type="submit" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar enlace seguro'}
        </button>
        {message && <p className="evh-form-feedback" role="status">{message}</p>}
      </form>
      <p className="evh-form-alternate"><Link to="/login">Volver a iniciar sesión</Link></p>
    </FormPage>
  );
};

export default RecoverPassword;
