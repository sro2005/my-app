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

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('authToken');

    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }

    const fetchProducts = async () => {
      try {
        console.log('Inicio de la solicitud: setting loading to true');
        setLoading(true);
        console.log("API URL:", API_URL);
        console.log("Token de Autenticación:", token);
        
        const response = await axios.get(`${API_URL}/api/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Productos recibidos:', response.data);

        // Verificar que userPreferences esté definido y contenga datos
        console.log('Preferencias del usuario:', userPreferences);

        if (!Array.isArray(userPreferences) || userPreferences.length === 0) {
          console.warn('No se encontraron preferencias del usuario, mostrando todos los productos.');
          setProductos(response.data);
        } else {
          // Filtrar productos basados en las preferencias del usuario
          const filteredProducts = response.data.filter(product => userPreferences.includes(product.category));
          console.log('Productos filtrados:', filteredProducts);
          setProductos(filteredProducts);
        }
      } catch (error) {
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

  return (
    <div className="container">
      <h2>Módulo de Inventario</h2>
      <p><b>Definición:</b> El modelo de inventario es una representación estructurada de los productos disponibles en un sistema o negocio.</p>
      <p><b>Propósito:</b> Su función principal es gestionar y mantener un registro detallado de los productos en stock, incluyendo su cantidad, ubicación, y atributos como nombre, descripción y precio.</p>
      <p><b>Importancia:</b> Permite a las empresas controlar eficientemente su inventario, optimizar la gestión de existencias, prevenir la escasez o el exceso de productos, y asegurar la disponibilidad de productos para satisfacer la demanda de los clientes.</p>
      <h2>Listado de Productos</h2>
      <ul className="productos-list">
        {productos.map(producto => (
          <ProductoItem key={producto._id} producto={producto} />
        ))}
      </ul>
    </div>
  );
};

export default ListadoProductos;



