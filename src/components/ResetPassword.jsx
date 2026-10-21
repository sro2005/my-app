import React, { useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 10 || password !== confirmation) {
      setMessage('La contraseña debe tener al menos 10 caracteres y coincidir con la confirmación.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const api = process.env.REACT_APP_API_BASE_URL;
      const response = await axios.post(`${api}/api/customers/reset-password/${token}`, { password });
      setSuccess(true);
      setPassword('');
      setConfirmation('');
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <form onSubmit={submit}>
        <h1>Restablecer contraseña</h1>
        <p>Elige una nueva contraseña de al menos 10 caracteres.</p>
        {!success && (
          <>
            <label htmlFor="new-password">Nueva contraseña</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={10} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} required />
            <label htmlFor="confirm-password">Confirmar contraseña</label>
            <input id="confirm-password" type="password" autoComplete="new-password" minLength={10} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} required />
            <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Cambiar contraseña'}</button>
          </>
        )}
        {message && <p role="status">{message}</p>}
        <Link to={success ? '/login' : '/recover-password'}>{success ? 'Ir a iniciar sesión' : 'Solicitar otro enlace'}</Link>
      </form>
    </main>
  );
};

export default ResetPassword;
