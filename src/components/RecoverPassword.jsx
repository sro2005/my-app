import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import FormPage from './FormPage';

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
      const response = await axios.post(`${apiUrl}/api/customers/forgot-password`, { email });
      setMessage(response.data.message || 'Se ha enviado un enlace para restablecer tu contraseña.');
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || 'Ocurrió un error inesperado.');
      } else {
        setMessage('Error de conexión. Verifica tu conexión a internet.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage eyebrow="RECUPERA EL ACCESO" title="Volvamos a conectarte" description="Te enviaremos un enlace seguro para que puedas crear una nueva contraseña.">
    <form className="evh-form" onSubmit={handleSubmit}>
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
