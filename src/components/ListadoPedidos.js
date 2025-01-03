import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Función para formatear el precio en formato local
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);
};

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

// Componente funcional para mostrar cada pedido
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
      </div>
    </div>
  </li>
);

// Componente funcional ListadoPedidos que muestra una lista de pedidos obtenidos desde la API
const ListadoPedidos = () => {
  // Estado para almacenar la lista de pedidos
  const [pedidos, setPedidos] = useState([]);

  // Efecto para realizar la petición GET a la API al cargar el componente
  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }
    axios.get(`${API_URL}/api/orders`)
      .then(response => {
        setPedidos(response.data);
      })
      .catch(error => {
        console.error('Error obteniendo pedidos:', error);
      });
  }, []);

  return (
    <div className="container">
      <h2>Módulo de Pedidos</h2>
      <p><b>Definición:</b> El modelo de pedidos describe el proceso completo de solicitud, procesamiento y entrega de productos o servicios a los clientes.</p>
      <p><b>Propósito:</b> Gestiona todas las etapas del ciclo de vida del pedido, desde la recepción inicial del pedido hasta su entrega final al cliente, garantizando una experiencia de compra satisfactoria.</p>
      <p><b>Importancia:</b> Facilita la coordinación entre diferentes departamentos, como ventas, logística y servicio al cliente, para garantizar una ejecución eficiente de los pedidos y mejorar la satisfacción del cliente.</p>
      
      <h2>Listado de Pedidos</h2>

      <ul className="pedidos-list">
        {pedidos.map(pedido => (
          <PedidoItem key={pedido._id} pedido={pedido} />
        ))}
      </ul>
    </div>
  );
};

export default ListadoPedidos;