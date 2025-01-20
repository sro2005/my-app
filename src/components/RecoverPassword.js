// src/components/RecoverPassword.js
import React, { useState } from 'react';
import axios from 'axios';

const RecoverPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    const API_URL = process.env.REACT_APP_API_BASE_URL;
    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }

    setLoading(true);

    axios.post(`${API_URL}/api/customers/forgot-password`, { email })
      .then(response => {
        setMessage('Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.');
        setMessageType('success');
      })
      .catch(error => {
        setMessage('Ocurrió un error. Por favor, intenta nuevamente.');
        setMessageType('error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Recuperar Contraseña</h1>
      <input
        type="email"
        placeholder="Correo Electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>Enviar Enlace</button>
      {message && (
        <p className={`message ${messageType === 'error' ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
      {loading && <div className="spinner">Procesando...</div>}
    </form>
  );
};

export default RecoverPassword;
