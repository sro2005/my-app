import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente funcional ListadoClientes que muestra una lista de clientes obtenidos desde la API
const ListadoClientes = () => {
  // Estado para almacenar la lista de clientes
  const [clientes, setClientes] = useState([]);

  // Efecto para realizar la petición GET a la API al cargar el componente
  useEffect(() => {
    axios.get('/api/customers')
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
    <div>
      {/* Título de la lista de clientes */}
      <h2>Listado de Clientes</h2>

      {/* Lista de clientes */}
      <ul>
        {clientes.map(cliente => (
          <li key={cliente.id}>
            {/* Mostrar nombre, apellido y correo electrónico de cada cliente */}
            {cliente.firstName} {cliente.lastName} - {cliente.email}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Exportar el componente ListadoClientes para que pueda ser utilizado en otros archivos
export default ListadoClientes;
