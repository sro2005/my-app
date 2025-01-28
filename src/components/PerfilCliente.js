import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners'; // Spinner personalizado

// Formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return 'Fecha no disponible';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Fecha no válida';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

// Formatear preferencias
const formatPreferences = (prefs) => {
  if (!prefs) return 'Sin preferencias';
  if (Array.isArray(prefs)) return prefs.join(', ');
  if (typeof prefs === 'string') return prefs.split(',').map(pref => pref.trim()).join(', ');
  return 'Preferencias no disponibles';
};

const PerfilCliente = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:5000';
      const token = localStorage.getItem('authToken');

      if (!token) {
        setError('No has iniciado sesión. Por favor, inicia sesión.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/customers/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomer(response.data);
      } catch (err) {
        const status = err.response?.status;
        if (status === 401) {
          setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          localStorage.removeItem('authToken'); // Eliminar token inválido
        } else {
          setError('Error al cargar el perfil. Intenta de nuevo más tarde.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="spinner-container">
        <ClipLoader size={50} color="#FFA500" />
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
        <p>No se encontró la información del perfil.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2>Perfil del Cliente</h2>
      <div className="profile-picture">
        <img 
          src={customer.profileImage || '/icono-user.png'} 
          alt="Foto del Cliente" 
        />
      </div>
      <div className="profile-info">
        <p><strong>Cliente:</strong> {customer.firstName} {customer.lastName}</p>
        <p><strong>Correo Electrónico:</strong> {customer.email}</p>
        <p><strong>Fecha de Nacimiento:</strong> {formatDate(customer.birthDate)}</p>
        <p><strong>Número de Identificación (C.C):</strong> {customer.identificationNumber || 'No disponible'}</p>
        <p><strong>Teléfono:</strong> {customer.phone || 'No disponible'}</p>
        <p><strong>Preferencias:</strong> {formatPreferences(customer.preferences)}</p>
      </div>
      <button className="update-button">Actualizar Información</button>
    </div>
  );
};

export default PerfilCliente;
