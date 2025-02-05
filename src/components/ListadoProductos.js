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
      <h2>Gestión de Inventarios</h2>
      <hr />
      <div className="module-description">
        <p><b>📖 DEFINICIÓN:</b> La Gestión de Inventarios es el proceso clave que permite controlar y mantener el stock de productos de manera eficiente y organizada. Incluye:</p>
          <ul>
            <li>Recepción de productos en el almacén.</li>
            <li>Control y registro de entradas y salidas.</li>
            <li>Monitoreo de niveles de stock.</li>
            <li>Gestión de reposición y órdenes de compra.</li>
            <li>Optimización del espacio de almacenamiento.</li>
            <li>Control de productos deteriorados o fuera de servicio.</li>
          </ul>
        <hr />
        <p><b>🎯 OBJETIVO:</b> Asegurar que siempre haya suficiente stock disponible para satisfacer la demanda de los clientes, evitar desabastecimientos o exceso de inventario, y mantener una gestión eficiente de los productos en todo momento.</p>
        <hr />
        <p><b>📈 IMPORTANCIA:</b></p>
          <ul>
            <li><b>Optimización de recursos:</b> Mantener niveles de inventario adecuados evita tanto los desabastecimientos como los costos asociados con el exceso de productos.</li>
            <li><b>Mejora en la satisfacción del cliente:</b> Asegura que los productos estén disponibles para la venta o entrega sin retrasos.</li>
            <li><b>Visibilidad en tiempo real:</b> El sistema permite conocer el estado actual del inventario, lo que facilita la toma de decisiones.</li>
            <li><b>Reducción de costos operativos:</b> Minimiza la necesidad de almacenar productos innecesarios y ayuda a evitar pérdidas por productos vencidos o dañados.</li>
          </ul>
        <hr />
        <p><b>🔍 PROCESO DE GESTIÓN DE INVENTARIOS:</b></p>
          <ol>
            <li><b>Recepción de productos:</b> Los productos son recibidos en el almacén, inspeccionados y registrados en el sistema.</li>
            <li><b>Control de stock:</b> Se realiza un seguimiento de la cantidad disponible de cada producto y se actualiza el inventario en tiempo real.</li>
            <li><b>Reposición y compras:</b> Cuando los niveles de stock son bajos, se generan órdenes de compra para asegurar la reposición de productos.</li>
            <li><b>Gestión de salidas:</b> Cuando los productos son vendidos o utilizados en pedidos, el inventario se actualiza para reflejar las cantidades restantes.</li>
            <li><b>Control de calidad:</b> Se realiza un seguimiento para asegurarse de que los productos no estén deteriorados o fuera de servicio, y se gestionan devoluciones si es necesario.</li>
            <li><b>Optimización del espacio:</b> El espacio de almacenamiento se organiza para mejorar el acceso a los productos y reducir tiempos de búsqueda.</li>
          </ol>
        <hr />
        <p><b>🚀 BENEFICIOS DE UNA BUENA GESTIÓN DE INVENTARIOS:</b></p>
          <ul>
            <li><b>Reducción de costos:</b> Evita la sobrecompra y la acumulación innecesaria de productos.</li>
            <li><b>Mayor precisión:</b> Mantiene un control exacto sobre el stock, reduciendo errores de inventario.</li>
            <li><b>Mejor respuesta a la demanda:</b> Permite tener productos disponibles para satisfacer las necesidades del cliente de forma rápida y precisa.</li>
            <li><b>Eficiencia operativa:</b> Mejora la organización del almacén y facilita la gestión de pedidos y devoluciones.</li>
          </ul>
        <hr />
        <p><b>👥 ¿CÓMO INTERACTÚAN LOS USUARIOS CON LA GESTIÓN DE INVENTARIOS?</b></p>
          <ul>
            <li><b>Administradores:</b> Supervisan el inventario, gestionan los niveles de stock y ordenan la reposición de productos.</li>
            <li><b>Almacén/Logística:</b> Se encargan de recibir, almacenar, organizar y despachar los productos según las órdenes.</li>
            <li><b>Ventas:</b> Consultan el inventario para verificar la disponibilidad de productos y realizar ventas sin inconvenientes.</li>
          </ul>
        <hr />
      </div>

      <h2>Listado de Inventarios</h2>
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
