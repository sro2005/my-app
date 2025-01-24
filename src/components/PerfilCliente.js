import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners'; // Spinner personalizado

// Función para formatear la fecha en formato DD/MM/YYYY sin hora
const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Fecha no válida';
  }
  const utcDate = new Date(date.toUTCString());
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const year = utcDate.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const formatPreferences = (prefs) => {
  if (Array.isArray(prefs)) {
    return prefs.join(', ');
  } else if (typeof prefs === 'string') {
    return prefs.split(',').map(pref => pref.trim()).join(', ');
  }
  return 'Preferencias no disponibles';
};

const PerfilCliente = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true); // Añadir estado de carga
  const [error, setError] = useState(null); // Añadir estado de error

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('authToken');
    
    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }

    axios.get(`${API_URL}/api/customers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      setCustomer(response.data[0]);
      setLoading(false); // Terminar carga
    })
    .catch(error => {
      setError('ERROR AL OBTENER EL PERFIL');
      setLoading(false); // Terminar carga
      console.error('Error obteniendo perfil:', error);
    });
  }, []);

  if (loading) {
    return (
      <div className="spinner">
        <ClipLoader size={50} color="#4CAF50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2>Perfil de Cliente</h2>
      <div className="profile-picture">
        <img src='/icono-user.png' alt="Foto del Cliente" />
      </div>
      <div className="profile-info">
        <p><strong>Cliente:</strong> {customer.firstName} {customer.lastName}</p>
        <p><strong>Correo Electrónico:</strong> {customer.email}</p>
        <p><strong>Fecha de Nacimiento:</strong> {formatDate(customer.birthDate)}</p>
        <p><strong>Número de Identificación (C.C):</strong> {customer.identificationNumber}</p>
        <p><strong>Teléfono:</strong> {customer.phone}</p>
        <p><strong>Preferencias:</strong> {formatPreferences(customer.preferences)}</p>
      </div>
      <button className="update-button">Actualizar Información</button> {/* Botón de actualización */}
    </div>
  );
};

export default PerfilCliente;
