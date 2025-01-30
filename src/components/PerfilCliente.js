import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';

const PerfilCliente = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    identificationNumber: '',
    phone: '',
    preferences: '',
  });


  useEffect(() => {
    const fetchProfile = async () => {
      const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:5000';
      const token = localStorage.getItem('authToken');

      if (!token) return handleError('No has iniciado sesión. Por favor, inicia sesión.');

      try {
        const { data } = await axios.get(`${API_URL}/api/customers/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomer(data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError('Tu sesión ha expirado. Inicia sesión nuevamente.');
          setTimeout(() => {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
          }, 2000);
        } else {
          handleError('Error al cargar el perfil.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleError = (message) => {
    setError(message);
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveClick = async () => {
    const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:5000';
    const token = localStorage.getItem('authToken');

    try {
      const { data } = await axios.put(`${API_URL}/api/customers/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomer(data);
      setIsEditing(false);
    } catch (err) {
      handleError('Error al guardar la información.');
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  if (loading) return <div className="spinner-container"><ClipLoader size={50} color="#FFA500" /></div>;
  if (error) return <div className="error-message"><p>{error}</p></div>;
  if (!customer) return <div className="error-message"><p>No se encontró la información del perfil.</p></div>;

  return (
    <div className="profile-container">
      <h2>Perfil del Cliente</h2>
        <div className="profile-picture">
          <img src='/icono-user.png' alt="Foto de Perfil" />
        </div>

      {!isEditing ? (
        <div className="profile-info">
          <div className="profile-field">
            <strong>Cliente:</strong> 
            <p>{customer.firstName} {customer.lastName}</p>
          </div>
          <div className="profile-field">
            <strong>Correo Electrónico:</strong> 
            <p>{customer.email}</p>
          </div>
          <div className="profile-field">
            <strong>Fecha de Nacimiento:</strong> 
            <p>{formatDate(customer.birthDate)}</p>
          </div>
          <div className="profile-field">
            <strong>Número de Identificación (C.C):</strong> 
            <p>{customer.identificationNumber || 'No disponible'}</p>
          </div>
          <div className="profile-field">
            <strong>Número de Celular:</strong> 
            <p>{customer.phone || 'No disponible'}</p>
          </div>
          <div className="profile-field">
            <strong>Preferencias:</strong> 
            <p>{formatPreferences(customer.preferences)}</p>
          </div>
          <button className="edit-button" onClick={() => setIsEditing(true)}>EDITAR INFORMACIÓN</button>
        </div>
      ) : (
        <div className="profile-edit">
          {['NOMBRE(S)', 'APELLIDO(S)', 'E-MAIL', 'FECHA DE NACIMIENTO', 'NÚMERO DE IDENTIFICACIÓN (C.C)', 'NÚMERO DE CELULAR', 'PREFERENCIAS'].map((field) => (
            <div key={field} className="profile-edit-field">
              <label>{capitalizeFirstLetter(field) + ':'}</label>
              <input
                type={field === 'FECHA DE NACIMIENTO' ? 'date' : 'text'}
                name={field.toLowerCase().replace(/ /g, '')} // Para evitar problemas con nombres de campos
                value={formData[field.toLowerCase().replace(/ /g, '')] || ''}
                onChange={handleInputChange}
              />
            </div>
          ))}
          <div className="profile-buttons">
            <button className="cancel-button-profile" onClick={handleCancelClick}>CANCELAR</button>
            <button className="save-button" onClick={handleSaveClick}>GUARDAR CAMBIOS</button>
        </div>
      </div>
      )}
    </div>
  );
};

// Función para formatear la fecha
const formatDate = (dateString) => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return 'Fecha no válida'; // Devuelve un mensaje de error si la fecha es inválida
  }

  // Obtener la fecha en formato UTC
  const utcDate = new Date(date.toUTCString());

  // Formatear la fecha en formato DD/MM/YYYY
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const year = utcDate.getUTCFullYear();

  return `${day}/${month}/${year}`;
};

// Función para formatear las preferencias
const formatPreferences = (prefs) => {
  if (!prefs) return 'Sin preferencias';
  return Array.isArray(prefs) ? prefs.join(', ') : prefs.split(',').map(p => p.trim()).join(', ');
};

// Función para capitalizar la primera letra de las palabras
const capitalizeFirstLetter = (string) => {
  return string
    .split('_') // Separar palabras si hay guiones bajos
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitaliza cada palabra
    .join(' ') // Junta las palabras con espacios
    .toUpperCase(); // Convierte todo a mayúsculas
};

export default PerfilCliente;