import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente funcional ListadoProductos que muestra una lista de productos obtenidos desde la API
const ListadoProductos = () => {
  // Estado para almacenar la lista de productos
  const [productos, setProductos] = useState([]);

  // Efecto para realizar la petición GET a la API al cargar el componente
  useEffect(() => {
    axios.get('/api/products')
      .then(response => {
        // Actualizar el estado de productos con los datos recibidos
        setProductos(response.data);
      })
      .catch(error => {
        // Manejar errores en caso de que la petición falle
        console.error('Error obteniendo productos:', error);
      });
  }, []); // El array vacío asegura que el efecto se ejecute solo una vez al cargar el componente

  return (
    <div>
      {/* Título de la lista de productos */}
      <h2>Listado de Productos</h2>

      {/* Lista de productos */}
      <ul>
        {productos.map(producto => (
          <li key={producto.id}>
            {/* Mostrar nombre y descripción de cada producto */}
            {producto.name} - {producto.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Exportar el componente ListadoProductos para que pueda ser utilizado en otros archivos
export default ListadoProductos;

