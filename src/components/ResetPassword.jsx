import React, { useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import FormPage from './FormPage';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const strongPassword = password.length >= 10 &&
      password.length <= 128 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*]/.test(password);

    if (!strongPassword || password !== confirmation) {
      setMessage('Usa entre 10 y 128 caracteres con mayúscula, minúscula, número y símbolo; ambas contraseñas deben coincidir.');
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
    <FormPage eyebrow="SEGURIDAD DE TU CUENTA" title="Crea una nueva contraseña" description="Elige una contraseña segura para volver a entrar a tu espacio ElectroVibeHome.">
      <form className="evh-form" onSubmit={submit}>
        <p className="evh-form-hint">Usa entre 10 y 128 caracteres e incluye mayúscula, minúscula, número y símbolo.</p>
        {!success && (
          <>
            <div className="evh-form-field">
            <label htmlFor="new-password">Nueva contraseña</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={10} maxLength={128} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{10,128}" title="Incluye mayúscula, minúscula, número y símbolo." value={password} onChange={event => setPassword(event.target.value)} required />
            </div>
            <div className="evh-form-field">
            <label htmlFor="confirm-password">Confirmar contraseña</label>
            <input id="confirm-password" type="password" autoComplete="new-password" minLength={10} maxLength={128} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{10,128}" title="Incluye mayúscula, minúscula, número y símbolo." value={confirmation} onChange={event => setConfirmation(event.target.value)} required />
            </div>
            <button className="evh-form-submit" type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar contraseña'}</button>
          </>
        )}
        {message && <p className={`evh-form-feedback ${success ? 'is-success' : 'is-error'}`} role={success ? 'status' : 'alert'}>{message}</p>}
      </form>
      <p className="evh-form-alternate"><Link to={success ? '/login' : '/recover-password'}>{success ? 'Ir a iniciar sesión' : 'Solicitar otro enlace'}</Link></p>
    </FormPage>
  );
};

export default ResetPassword;
