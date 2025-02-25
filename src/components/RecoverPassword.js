import React, { useState } from 'react';
import axios from 'axios';

const RecoverPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_BASE_URL; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/customers/forgot-password`, { email });
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
    <form onSubmit={handleSubmit}>
      <h1>Recuperar Contraseña</h1>
      <input
        type="email"
        placeholder="Correo Electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar Enlace"}
      </button>
      {message && <p className="message">{message}</p>}
      {loading && <div className="spinner"><i className="fas fa-spinner fa-spin"></i></div>}
    </form>
  );
};

export default RecoverPassword;