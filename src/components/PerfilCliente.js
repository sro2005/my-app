import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Función para formatear la fecha en formato DD/MM/YYYY sin hora
const formatDate = (dateString) => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return 'Fecha no válida'; // Devuelve un mensaje de error si la fecha es inválida
  }

  // Obtener la fecha en formato UTC
  const utcDate = new Date(date.toUTCString());

  // Formatear la fecha en formato DD/MM/YYYY
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
  const year = utcDate.getUTCFullYear();

  return `${day}/${month}/${year}`;
};

const PerfilCliente = () => {
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    axios.get('/api/customers') // Asegúrate de que esta ruta sea correcta
      .then(response => {
        setCustomer(response.data[0]); // Asegúrate de que la API retorne un array
      })
      .catch(error => {
        console.error('Error obteniendo perfil:', error);
      });
  }, []);

  if (!customer) return <p className="loading">Cargando...</p>;

  return (
    <div className="profile-container">
      <h2>Perfil de Cliente</h2>
      <div className="profile-picture">
      <img src='/icono-user.png' alt="Foto del Cliente" 
        />
      </div>
      <div className="profile-info">
        <p><strong>Nombre:</strong> {customer.firstName} {customer.lastName}</p>
        <p><strong>Correo Electrónico:</strong> {customer.email}</p>
        <p><strong>Fecha de Nacimiento:</strong> {formatDate(customer.birthDate)}</p>
        <p><strong>Dirección:</strong> {customer.address}</p>
        <p><strong>Teléfono:</strong> {customer.phone}</p>
        <p><strong>Preferencias:</strong> {customer.preferences}</p>
      </div>
    </div>
  );
};

export default PerfilCliente;
