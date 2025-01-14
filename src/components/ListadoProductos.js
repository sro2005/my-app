import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Función para formatear el precio en formato local
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);
};

// Componente funcional para mostrar cada producto
const ProductoItem = ({ producto }) => (
  <li className="producto-item">
    <div className="producto-info">
      <div className="producto-image">
      <img src={producto.imageUrl} alt={producto.name}/>
      </div>
      <div className="producto-details">
        <p><strong>Nombre del Producto:</strong> {producto.name}</p>
        <p><strong>Descripción:</strong> {producto.description}</p>
        <p><strong>Precio:</strong> {formatPrice(producto.price)}</p>
        <p><strong>Categoría:</strong> {producto.category}</p>
      </div>
    </div>
  </li>
);

// Componente funcional ListadoProductos que muestra una lista de productos obtenidos desde la API
const ListadoProductos = () => {
  // Estado para almacenar la lista de productos
  const [productos, setProductos] = useState([]);

  // Efecto para realizar la petición GET a la API al cargar el componente
  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }
    axios.get(`${API_URL}/api/products`)
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
    <div className="container">
      <h2>Módulo de Inventario</h2>
      <p><b>Definición:</b> El modelo de inventario es una representación estructurada de los productos disponibles en un sistema o negocio.</p>
      <p><b>Propósito:</b> Su función principal es gestionar y mantener un registro detallado de los productos en stock, incluyendo su cantidad, ubicación, y atributos como nombre, descripción y precio.</p>
      <p><b>Importancia:</b> Permite a las empresas controlar eficientemente su inventario, optimizar la gestión de existencias, prevenir la escasez o el exceso de productos, y asegurar la disponibilidad de productos para satisfacer la demanda de los clientes.</p>
      {/* Título de la lista de productos */}
      <h2>Listado de Productos</h2>

      {/* Lista de productos */}
      <ul className="productos-list">
        {productos.map(producto => (
          <ProductoItem key={producto._id} producto={producto} />
        ))}
      </ul>
    </div>
  );
};

// Exportar el componente ListadoProductos para que pueda ser utilizado en otros archivos
export default ListadoProductos;
