import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
        <img src="/icono-user.png" alt="Icono de Usuario"/>
      </div>
      <div className="cliente-details">
        <p><strong>Nombre del Cliente:</strong> {cliente.firstName} {cliente.lastName}</p>
        <p><strong>Email:</strong> {cliente.email}</p>
        <p><strong>Teléfono:</strong> {cliente.phone}</p>
        <p><strong>Registrado:</strong> {formatDateTime(cliente.registrationDate)}</p>
        {/* Añadir más detalles si es necesario */}
      </div>
    </div>
  </li>
);

// Componente funcional ListadoClientes que muestra una lista de clientes obtenidos desde la API
const ListadoClientes = () => {
  // Estado para almacenar la lista de clientes
  const [clientes, setClientes] = useState([]);

  // Efecto para realizar la petición GET a la API al cargar el componente
  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    axios.get(`${API_URL}/api/customers`)
      .then(response => {
        // Actualizar el estado de clientes con los datos recibidos
        setClientes(response.data);
      })
      .catch(error => {
        // Manejar errores en caso de que la petición falle
        console.error('Error obteniendo clientes:', error);
      });
  }, []); // El array vacío asegura que el efecto se ejecute solo una vez al cargar el componente

  return (
    <div className="container">
      <h2>Módulo de Cliente</h2>
      <p><b>Definición:</b> El modelo de cliente representa la información y las interacciones de los clientes con una empresa o servicio.</p>
      <p><b>Propósito:</b> Administra los perfiles de los clientes, incluyendo datos personales, historial de compras, preferencias y cualquier otra información relevante para ofrecer una experiencia personalizada y satisfactoria.</p>
      <p><b>Importancia:</b> Permite a las empresas conocer mejor a sus clientes, ofrecer productos y servicios adaptados a sus necesidades, y construir relaciones sólidas y duraderas con ellos. Esto puede conducir a una mayor fidelización de clientes, recomendaciones y crecimiento del negocio.</p>
      {/* Título de la lista de clientes */}
      <h2>Listado de Clientes</h2>

      {/* Lista de clientes */}
      <ul className="clientes-list">
        {clientes.map(cliente => (
          <ClienteItem key={cliente._id} cliente={cliente} />
        ))}
      </ul>
    </div>
  );
};

// Exportar el componente ListadoClientes para que pueda ser utilizado en otros archivos
export default ListadoClientes;
