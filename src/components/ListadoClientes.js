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
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      const API_URL = process.env.REACT_APP_API_BASE_URL;
      const token = localStorage.getItem('authToken'); // Obtener el token desde localStorage

      console.log('API_URL:', API_URL); // Log para depuración
      console.log('Token obtenido:', token); // Log para depuración

      if (!API_URL) {
        console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
        setError('La variable API_URL no está configurada.');
        setLoading(false);
        return;
      }

      if (!token) {
        console.warn('Token no encontrado en localStorage.');
        setError('Token no encontrado.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setClientes(response.data);
      } catch (error) {
        console.error('Error obteniendo clientes:', error.response || error.message);
        setError(error.response?.data?.message || 'Error obteniendo clientes');
      } finally {
        setLoading(false); // Detener la animación de carga en caso de éxito o error
      }
    };

    fetchCustomers();
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

  return (
    <div className="container">
      <h2>Gestión de Clientes</h2>
      <p><b>Definición:</b> El modelo de cliente representa la información y las interacciones de los clientes con una empresa o servicio.</p>
      <p><b>Propósito:</b> Administra los perfiles de los clientes, incluyendo datos personales, historial de compras, preferencias y cualquier otra información relevante para ofrecer una experiencia personalizada y satisfactoria.</p>
      <p><b>Importancia:</b> Permite a las empresas conocer mejor a sus clientes, ofrecer productos y servicios adaptados a sus necesidades, y construir relaciones sólidas y duraderas con ellos. Esto puede conducir a una mayor fidelización de clientes, recomendaciones y crecimiento del negocio.</p>
      <h2>Beneficios</h2>
      <p><b>Mejora en la Atención al Cliente:</b> Permite ofrecer un servicio más rápido y eficiente.</p>
      <p><b>Eficiencia Operativa:</b> Optimiza los procesos internos relacionados con la gestión de clientes.</p>
      <p><b>Análisis de Datos:</b> Proporciona herramientas para analizar el comportamiento de los clientes y prever tendencias.</p>
      <p><b>Integración:</b> Se integra fácilmente con otros sistemas como CRM y ERP.</p>
      <h2>Funcionalidades Clave</h2>
      <p><b>Gestión de Perfiles:</b> Crear, editar y eliminar perfiles de clientes.</p>
      <p><b>Historial de Compras:</b> Acceso rápido al historial de compras y detalles de transacciones.</p>
      <p><b>Notas y Seguimientos:</b> Posibilidad de añadir notas y seguimientos a cada perfil de cliente.</p>
      <p><b>Alertas y Recordatorios:</b> Configuración de alertas y recordatorios para el seguimiento de clientes.</p>
      <p><b>Informes y Analíticas:</b> Generación de informes detallados y análisis de datos de clientes.</p>
      <p><b>Seguridad:</b> Medidas de seguridad para proteger la información sensible de los clientes.</p>
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
