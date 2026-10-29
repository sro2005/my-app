import React, { useContext, useState } from 'react';
import axios from 'axios';
import FormPage from './FormPage';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ChangePassword = () => {
  const { user } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setFeedback(null);

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'La confirmación no coincide con la nueva contraseña.' });
      return;
    }

    const apiUrl = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
    const token = localStorage.getItem('authToken');
    if (!apiUrl || !token) {
      setFeedback({ type: 'error', message: 'Tu sesión o la conexión no están disponibles. Inicia sesión de nuevo.' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(`${apiUrl}/api/auth/change-password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedback({ type: 'success', message: response.data?.message || 'Contraseña actualizada correctamente.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'No fue posible actualizar la contraseña. Inténtalo nuevamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage
      eyebrow="SEGURIDAD DE LA CUENTA"
      title="Cambia tu contraseña"
      description="Protege tu acceso con una contraseña única que no utilices en otros servicios."
    >
      <form className="evh-form evh-change-password-form" onSubmit={handleSubmit}>
        <p className="evh-form-hint">Usa al menos 12 caracteres con mayúscula, minúscula, número y símbolo. Nunca compartas esta contraseña.</p>
        <div className="evh-form-field">
          <label htmlFor="current-password">Contraseña actual</label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={event => setCurrentPassword(event.target.value)}
            required
          />
        </div>
        <div className="evh-form-field">
          <label htmlFor="new-password">Nueva contraseña</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{12,128}"
            title="Usa 12 caracteres o más, con mayúscula, minúscula, número y símbolo."
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            required
          />
        </div>
        <div className="evh-form-field">
          <label htmlFor="confirm-password">Confirma la nueva contraseña</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            required
          />
        </div>
        <button className="evh-form-submit" type="submit" disabled={loading}>
          {loading ? 'Actualizando…' : 'Actualizar Contraseña'}
        </button>
        {feedback && (
          <p className={`evh-form-feedback is-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
            {feedback.message}
          </p>
        )}
      </form>
      <p className="evh-form-alternate"><Link to="/home-page">{user?.role === 'admin' ? 'Volver al Panel de Administración' : 'Volver a Inicio'}</Link></p>
    </FormPage>
  );
};

export default ChangePassword;
