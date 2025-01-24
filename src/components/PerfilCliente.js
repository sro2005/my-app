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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('authToken');
    
    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }

    console.log("URL de la API:", API_URL); // Consola para URL
    console.log("Token de Autenticación:", token); // Consola para el token

    // Realizamos la petición GET a la API para obtener los datos del cliente
    axios.get(`${API_URL}/api/customers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      console.log("Respuesta de la API:", response.data); // Consola para la respuesta
      if (response.data) { // Verificamos que la respuesta tenga datos
        setCustomer(response.data);
      } else {
        setError('No se encontró el perfil del cliente.');
      }
      setLoading(false);
    })
    .catch(error => {
      // Si el error es debido a la falta de autenticación o token
      console.error('Error obteniendo perfil:', error.response || error);
      setError('ERROR AL OBTENER EL PERFIL');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="spinner-container">
        <ClipLoader size={50} color="#FFA500" /> {/* Spinner personalizado */}
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

  if (!customer) {
    return (
      <div className="error-message">
        <p>No se encontró el perfil del cliente.</p>
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
      <button className="update-button">Actualizar Información</button>
    </div>
  );
};

export default PerfilCliente;
