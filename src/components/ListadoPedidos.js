import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente funcional ListadoPedidos que muestra una lista de pedidos obtenidos desde la API
const ListadoPedidos = () => {
  // Estado para almacenar la lista de pedidos
  const [pedidos, setPedidos] = useState([]);

  // Efecto para realizar la petición GET a la API al cargar el componente
  useEffect(() => {
    axios.get('/api/orders')
      .then(response => {
        // Actualizar el estado de pedidos con los datos recibidos
        setPedidos(response.data);
      })
      .catch(error => {
        // Manejar errores en caso de que la petición falle
        console.error('Error obteniendo pedidos:', error);
      });
  }, []); // El array vacío asegura que el efecto se ejecute solo una vez al cargar el componente

  return (
    <div class="container">
      <h2>Módulo de Pedidos</h2>
         <p><b>Definición:</b> El modelo de pedidos describe el proceso completo de solicitud, procesamiento y entrega de productos o servicios a los clientes.</p>
         <p><b>Propósito:</b> Gestiona todas las etapas del ciclo de vida del pedido, desde la recepción inicial del pedido hasta su entrega final al cliente, garantizando una experiencia de compra satisfactoria.</p>
         <p><b>Importancia:</b> Facilita la coordinación entre diferentes departamentos, como ventas, logística y servicio al cliente, para garantizar una ejecución eficiente de los pedidos y mejorar la satisfacción del cliente.</p>
      {/* Título de la lista de pedidos */}
      <h2>Listado de Pedidos</h2>

      {/* Lista de pedidos */}
      <ul>
        {pedidos.map(pedido => (
          <li key={pedido.id}>
            {/* Mostrar nombre, apellido y monto total de cada pedido */}
            {pedido.firstName} {pedido.lastName} - {pedido.totalAmount}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Exportar el componente ListadoPedidos para que pueda ser utilizado en otros archivos
export default ListadoPedidos;

