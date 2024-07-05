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
    <div class="container">
      <h2>Módulo de Cliente</h2>
         <p><b>Definición:</b> El modelo de cliente representa la información y las interacciones de los clientes con una empresa o servicio.</p>
         <p><b>Propósito:</b> Administra los perfiles de los clientes, incluyendo datos personales, historial de compras, preferencias y cualquier otra información relevante para ofrecer una experiencia personalizada y satisfactoria.</p>
         <p><b>Importancia:</b> Permite a las empresas conocer mejor a sus clientes, ofrecer productos y servicios adaptados a sus necesidades, y construir relaciones sólidas y duraderas con ellos. Esto puede conducir a una mayor fidelización de clientes, recomendaciones y crecimiento del negocio.</p>
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
