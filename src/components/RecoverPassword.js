import React, { useState } from 'react';
import axios from 'axios';

const RecoverPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Restablece los mensajes al inicio
    setMessage('');
    setLoading(true);

    const API_URL = process.env.REACT_APP_API_BASE_URL; // Valor predeterminado si no está configurado

    axios.post(`${API_URL}/api/customers/forgot-password`, { email })
      .then(() => {
        setMessage('Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.');
      })
      .catch(() => {
        setMessage('Ocurrió un error. Por favor, intenta nuevamente.');
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
      {message && <p className="message">{message}</p>}
      {loading && <div className="spinner">Procesando...</div>}
    </form>
  );
};

export default RecoverPassword;