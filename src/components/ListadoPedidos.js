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
    <div>
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

