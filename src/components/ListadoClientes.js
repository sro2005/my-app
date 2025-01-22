import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClipLoader from 'react-spinners/ClipLoader'; // Importa el spinner

// Función para formatear la fecha en formato local
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Fecha no válida';
  }

  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' ' + date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Componente funcional para mostrar cada cliente
const ClienteItem = ({ cliente }) => (
  <li className="cliente-item">
    <div className="cliente-info">
      <div className="cliente-avatar">
        <img src="/icono-user.png" alt="Icono de Usuario" />
      </div>
      <div className="cliente-details">
        <p><strong>Nombre del Cliente:</strong> {cliente.firstName} {cliente.lastName}</p>
        <p><strong>Email:</strong> {cliente.email}</p>
        <p><strong>Teléfono:</strong> {cliente.phone}</p>
        <p><strong>Registrado:</strong> {formatDateTime(cliente.registrationDate)}</p>
      </div>
    </div>
  </li>
);

// Componente funcional ListadoClientes que muestra una lista de clientes obtenidos desde la API
const ListadoClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('authToken'); // Obtener el token desde localStorage

    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }

    axios.get(`${API_URL}/api/customers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        setClientes(response.data);
        setLoading(false); // Detener la animación de carga
      })
      .catch(error => {
        console.error('Error obteniendo clientes:', error);
        setLoading(false); // Detener la animación de carga en caso de error
      });
  }, []);

  if (loading) {
    return (
      <div className="spinner">
        <ClipLoader size={50} color="#4CAF50" /> {/* Spinner personalizado */}
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Módulo de Cliente</h2>
      <p><b>Definición:</b> El modelo de cliente representa la información y las interacciones de los clientes con una empresa o servicio.</p>
      <p><b>Propósito:</b> Administra los perfiles de los clientes, incluyendo datos personales, historial de compras, preferencias y cualquier otra información relevante para ofrecer una experiencia personalizada y satisfactoria.</p>
      <p><b>Importancia:</b> Permite a las empresas conocer mejor a sus clientes, ofrecer productos y servicios adaptados a sus necesidades, y construir relaciones sólidas y duraderas con ellos. Esto puede conducir a una mayor fidelización de clientes, recomendaciones y crecimiento del negocio.</p>
      <h2>Listado de Clientes</h2>
      <ul className="clientes-list">
        {clientes.map(cliente => (
          <ClienteItem key={cliente._id} cliente={cliente} />
        ))}
      </ul>
    </div>
  );
};

export default ListadoClientes;
