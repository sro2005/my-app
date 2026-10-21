import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { ClipLoader } from 'react-spinners';
import { AuthContext } from '../contexts/AuthContext';

const preferencesOptions = [
  { value: 'Aires Acondicionados', label: 'Aires Acondicionados' },
  { value: 'Aspiradoras', label: 'Aspiradoras' },
  { value: 'Batidoras', label: 'Batidoras' },
  { value: 'Bocinas Inteligentes o Parlantes Bluetooth', label: 'Bocinas Inteligentes o Parlantes Bluetooth' },
  { value: 'Cafeteras', label: 'Cafeteras' },
  { value: 'Celulares', label: 'Celulares' },
  { value: 'Computadores de Escritorio', label: 'Computadores de Escritorio' },
  { value: 'Computadores Portátiles', label: 'Computadores Portátiles' },
  { value: 'Consolas de Videojuegos', label: 'Consolas de Videojuegos' },
  { value: 'Estufas', label: 'Estufas' },
  { value: 'Impresoras', label: 'Impresoras' },
  { value: 'Lavadoras', label: 'Lavadoras' },
  { value: 'Licuadoras', label: 'Licuadoras' },
  { value: 'Microondas', label: 'Microondas' },
  { value: 'Planchas de Ropa', label: 'Planchas de Ropa' },
  { value: 'Refrigeradores', label: 'Refrigeradores' },
  { value: 'Sandwicheras', label: 'Sandwicheras' },
  { value: 'Secadores de Cabello', label: 'Secadores de Cabello' },
  { value: 'Tablets', label: 'Tablets' },
  { value: 'Televisores', label: 'Televisores' },
  { value: 'Tostadoras', label: 'Tostadoras' },
  { value: 'Ventiladores', label: 'Ventiladores' }
];

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
    preferences: []
  });
  
  const { updateUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchProfile = async () => {
      const API_URL = process.env.REACT_APP_API_BASE_URL;
      const token = localStorage.getItem('authToken');

      if (!token) {
        handleError('No has iniciado sesión. Por favor, inicia sesión.');
        return;
      }

      try {
        const { data } = await axios.get(`${API_URL}/api/customers/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCustomer(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          birthDate: formatDateInput(data.birthDate),
          identificationNumber: data.identificationNumber || '',
          phone: data.phone || '',
          preferences: data.preferences ? data.preferences.map(pref => preferencesOptions.find(option => option.value === pref)).filter(Boolean) : []
        });
      } catch (err) {
        console.error('Error al obtener el perfil:', err);
        handleError('Error al cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const formatIdentificationNumber = (number) => {
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleError = (message) => {
    setError(message);
    setLoading(false);
  };

  // Cargar datos en el formulario cuando se haga clic en "Editar"
  const handleEditClick = () => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        birthDate: formatDateInput(customer.birthDate),
        identificationNumber: customer.identificationNumber || '',
        phone: customer.phone || '',
        preferences: customer.preferences ? customer.preferences.map(pref => preferencesOptions.find(option => option.value === pref)).filter(Boolean) : []
     });
  }
   setIsEditing(true);
  }

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveClick = async () => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      handleError('No tienes autorización. Inicia sesión nuevamente.');
      return;
    }

    // Asegurar que `customer` y `_id` existan
    if (!customer || !customer._id) {
      handleError('No se pudo obtener el ID del cliente.');
      return;
    }

    try {
    // Convertir el arreglo de objetos de preferencias a un arreglo de strings
      const updatedData = {
        ...formData,
        preferences: Array.isArray(formData.preferences)
        ? formData.preferences.map(option => option.value)
        : []
      };
      const { data } = await axios.put(`${API_URL}/api/customers/${customer._id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
    // Actualizamos el cliente con la respuesta
      const updatedCustomer = data.updatedCustomer || data;
      setCustomer(updatedCustomer);
      updateUser(updatedCustomer);  // Actualiza el usuario en el contexto
      setIsEditing(false);
    } catch (err) {
      console.error('Error al guardar la información:', err);
      handleError(err.response?.data?.message || 'Error al guardar la información.');
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
            <p>{formatIdentificationNumber(customer.identificationNumber) || 'No disponible'}</p>
          </div>
          <div className="profile-field">
            <strong>Número de Celular:</strong> 
            <p>{customer.phone || 'No disponible'}</p>
          </div>
          <div className="profile-field">
            <strong>Preferencias:</strong> 
            <p>{formatPreferences(customer.preferences)}</p>
          </div>
          <button className="edit-button" onClick={handleEditClick}>EDITAR INFORMACIÓN</button>
        </div>
      ) : (
        <div className="profile-edit">
          <div className="profile-edit-field">
            <label>NOMBRE(S):</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} />
          </div>
          <div className="profile-edit-field">
            <label>APELLIDO(S):</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} />
          </div>
          <div className="profile-edit-field">
            <label>E-MAIL:</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
          </div>
          <div className="profile-edit-field">
            <label>FECHA DE NACIMIENTO:</label>
            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} />
          </div>
          <div className="profile-edit-field">
            <label>NÚMERO DE IDENTIFICACIÓN (C.C):</label>
            <input type="text" name="identificationNumber" value={formData.identificationNumber} onChange={handleInputChange} />
          </div>
          <div className="profile-edit-field">
            <label>NÚMERO DE CELULAR:</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
          </div>
          <div className="profile-edit-field">
            <label>PREFERENCIAS:</label>
            <Select isMulti options={preferencesOptions} value={formData.preferences} onChange={(selectedOptions) => setFormData(prev => ({ ...prev, preferences: selectedOptions }))} placeholder="Seleccionar Nuevas Preferencias" className="select-preferences" classNamePrefix="select-preferences" />
          </div>
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
  if (!dateString) return 'Fecha no válida';

  // Intentamos crear la fecha directamente
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return 'Fecha no válida';
  }

  // Asegurar que sea interpretada correctamente
  const utcDate = new Date(date.toISOString()); 

  // Extraer día, mes y año
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const year = utcDate.getUTCFullYear();

  return `${day}/${month}/${year}`;
};

const formatDateInput = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
};

// Función para formatear las preferencias
const formatPreferences = (prefs) => {
  if (!prefs) return 'Sin preferencias';
  return Array.isArray(prefs) ? prefs.join(', ') : prefs.split(',').map(p => p.trim()).join(', ');
};

export default PerfilCliente;