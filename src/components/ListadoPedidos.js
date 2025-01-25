import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClipLoader from 'react-spinners/ClipLoader'; // Importar el spinner

// Función para formatear el precio en formato local (COP)
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);
};

// Función para formatear la fecha en formato DD/MM/YYYY
const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Fecha no válida'; // Retorna un mensaje si la fecha es inválida
  
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
};

// Componente para cada pedido individual
const PedidoItem = ({ pedido }) => (
  <li className="pedido-item">
    <div className="pedido-info">
      <div className="pedido-image">
        <img src="/icono-order.jpg" alt="Icono de pedido" />
      </div>
      <div className="pedido-details">
        <p><strong>Nombre del Cliente:</strong> {pedido.firstName} {pedido.lastName}</p>
        <p><strong>ID del Pedido:</strong> {pedido._id}</p>
        <p><strong>Dirección del Domicilio:</strong> {pedido.address}</p>
        <p><strong>Monto Total:</strong> {formatPrice(pedido.totalAmount)}</p>
        <p><strong>Fecha Estimada de Entrega del Pedido:</strong> {formatDate(pedido.deliveryDate)}</p>
        <p><strong>Estado del Pedido:</strong> {pedido.status || 'Estado no disponible'}</p>
      </div>
    </div>
  </li>
);

const ListadoPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Estado para manejar errores

  // Realizar la solicitud cuando el componente se monta
  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('authToken'); // Obtener el token de autenticación desde el almacenamiento local

    // Verifica si la URL de la API está configurada
    if (!API_URL) {
      setError('La URL de la API no está configurada.');
      setLoading(false);
      return;
    }

    // Función para obtener los pedidos desde la API
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setPedidos(response.data); // Guardar los pedidos obtenidos
      } catch (err) {
        setError('Hubo un error al obtener los pedidos. Intente nuevamente más tarde.');
        console.error('Error al obtener pedidos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders(); // Llamar a la función para obtener los pedidos
  }, []); // Solo se ejecuta una vez al montar el componente

  // Mostrar el spinner de carga mientras se obtienen los datos
  if (loading) {
    return (
      <div className="spinner-container">
        <ClipLoader size={50} color="#FFA500" />
      </div>
    );
  }

  // Si ocurre un error, mostrar un mensaje de error
  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Módulo de Pedidos</h2>
      <p><b>Definición:</b> El modelo de pedidos describe el proceso completo de solicitud, procesamiento y entrega de productos o servicios a los clientes.</p>
      <p><b>Propósito:</b> Gestiona todas las etapas del ciclo de vida del pedido, desde la recepción inicial del pedido hasta su entrega final al cliente.</p>
      <p><b>Importancia:</b> Facilita la coordinación entre diferentes departamentos para garantizar una ejecución eficiente de los pedidos.</p>
      
      <h2>Listado de Pedidos</h2>
      <ul className="pedidos-list">
        {pedidos.length > 0 ? (
          pedidos.map((pedido) => (
            <PedidoItem key={pedido._id} pedido={pedido} />
          ))
        ) : (
          <p>No hay pedidos disponibles.</p> // Si no hay pedidos, mostrar mensaje
        )}
      </ul>
    </div>
  );
};

export default ListadoPedidos;
