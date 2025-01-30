import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClipLoader from 'react-spinners/ClipLoader'; // Importa el spinner

// Función para formatear el precio en formato local
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);
};

// Componente funcional para mostrar cada producto
const ProductoItem = ({ producto }) => (
  <li className="producto-item">
    <div className="producto-info">
      <div className="producto-image">
        <img src={producto.imageUrl} alt={producto.name} />
      </div>
      <div className="producto-details">
        <p><strong>Nombre del Producto:</strong> {producto.name}</p>
        <p><strong>Descripción:</strong> {producto.description}</p>
        <p><strong>Precio:</strong> {formatPrice(producto.price)}</p>
        <p><strong>Categoría:</strong> {producto.category}</p>
        <p><strong>Cantidad disponible:</strong> {producto.quantity > 0 ? `${producto.quantity} unidades` : 'Producto agotado'}</p>
      </div>
    </div>
  </li>
);

const ListadoProductos = ({ userPreferences }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Agregamos estado para el error

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('authToken');

    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null); // Reseteamos cualquier error antes de la solicitud

        const response = await axios.get(`${API_URL}/api/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Filtramos productos basados en las preferencias del usuario, si existen
        const filteredProducts = Array.isArray(userPreferences) && userPreferences.length
          ? response.data.filter(product => userPreferences.includes(product.category))
          : response.data;

        setProductos(filteredProducts);
      } catch (error) {
        setError('Hubo un error al obtener los productos. Intenta nuevamente.');
        console.error('Error obteniendo productos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [userPreferences]);

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
      <h2>Gestión de Inventario</h2>
      <div className="module-description">
        <p><strong>Definición:</strong> Un módulo de inventario es un sistema que ayuda a administrar los productos disponibles en un negocio, proporcionando detalles como su cantidad, ubicación, precio y otros atributos importantes.</p>
        <p><strong>Propósito:</strong> Su función principal es llevar un registro detallado de los productos, optimizando la gestión de existencias y evitando problemas como desabastecimiento o exceso de productos.</p>
        <p><strong>Importancia:</strong> Un buen manejo de inventarios asegura que los productos estén disponibles cuando los clientes los necesiten, lo que mejora la satisfacción y optimiza la rentabilidad.</p>
      </div>

      <h2>Listado de Inventario</h2>
      <ul className="productos-list">
        {productos.length > 0 ? (
          productos.map(producto => (
            <ProductoItem key={producto._id} producto={producto} />
          ))
        ) : (
          <p>No hay productos disponibles.</p>
        )}
      </ul>
    </div>
  );
};

export default ListadoProductos;
