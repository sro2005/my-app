import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import ClipLoader from 'react-spinners/ClipLoader'; 
import { AuthContext } from '../contexts/AuthContext';

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
        <p><strong>Precio:</strong> {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(producto.price)}</p>
        <p><strong>Categoría:</strong> {producto.category}</p>
        <p><strong>Cantidad disponible:</strong> {producto.quantity > 0 ? `${producto.quantity} unidades` : 'Producto agotado'}</p>
      </div>
    </div>
  </li>
);

const ListadoProductos = () => {
  const { user } = useContext(AuthContext); // Obtenemos el usuario del contexto
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('authToken');

    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Si hay token, asumimos que el backend filtrará según las preferencias del usuario
        const endpoint = 
          token && user && user.preferences && user.preferences.length > 0
            ? `${API_URL}/api/products/preferences` 
            : `${API_URL}/api/products`;

        const response = await axios.get(endpoint, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        setProductos(response.data);
      } catch (error) {
        setError('Hubo un error al obtener los productos. Intenta nuevamente.');
        console.error('Error obteniendo productos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

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
        <p><b>📖 DEFINICIÓN:</b> La <strong>Gestión de Inventarios</strong> en <strong>ElectroVibeHome</strong> es el proceso clave que permite <strong>controlar</strong> y <strong>mantener</strong> el <strong>stock</strong> de productos de manera <strong>eficiente</strong> y <strong>organizada</strong>. Este proceso incluye:</p>
          <ul>
            <li>Recepción de productos en el almacén.</li>
            <li>Control y registro de entradas y salidas.</li>
            <li>Monitoreo de niveles de stock.</li>
            <li>Gestión de reposición y órdenes de compra.</li>
            <li>Optimización del espacio de almacenamiento.</li>
            <li>Control de productos deteriorados o fuera de servicio.</li>
          </ul>
      <hr />
        <p><b>🎯 OBJETIVO:</b> Asegurar que siempre haya suficiente stock disponible para satisfacer la demanda de los clientes, evitando desabastecimientos o exceso de inventario, y manteniendo una gestión eficiente de los productos en todo momento.</p>
        <hr />
        <p><b>📈 IMPORTANCIA:</b></p>
          <ul>
            <li><b>Optimización de recursos:</b> Mantener niveles adecuados de inventario evita tanto los desabastecimientos como los costos asociados al exceso de productos.</li>
            <li><b>Mejora en la satisfacción del cliente:</b> Garantiza que los productos estén disponibles para la venta o entrega sin retrasos.</li>
            <li><b>Visibilidad en tiempo real:</b> Permite conocer el estado actual del inventario, facilitando la toma de decisiones.</li>
            <li><b>Reducción de costos operativos:</b> Minimiza la necesidad de almacenar productos innecesarios y ayuda a evitar pérdidas por productos vencidos o dañados.</li>
          </ul>
      <hr />
        <p><b>🔍 PROCESO DE GESTIÓN DE INVENTARIOS:</b></p>
          <ol>
            <li><b>Recepción de productos:</b> Los productos son recibidos en el almacén, inspeccionados y registrados en el sistema.</li>
            <li><b>Control de stock:</b> Se realiza un seguimiento de la cantidad disponible de cada producto y se actualiza el inventario en tiempo real.</li>
            <li><b>Reposición y compras:</b> Cuando los niveles de stock son bajos, se generan órdenes de compra para asegurar la reposición de productos.</li>
            <li><b>Gestión de salidas:</b> Al venderse o utilizarse en pedidos, el inventario se actualiza para reflejar las cantidades restantes.</li>
            <li><b>Control de calidad:</b> Se verifica que los productos no estén deteriorados o fuera de servicio y se gestionan las devoluciones cuando es necesario.</li>
            <li><b>Optimización del espacio:</b> El área de almacenamiento se organiza para mejorar el acceso a los productos y reducir los tiempos de búsqueda.</li>
          </ol>
      <hr />
        <p><b>🚀 BENEFICIOS DE UNA BUENA GESTIÓN DE INVENTARIOS:</b></p>
          <ul>
            <li><b>Reducción de costos:</b> Evita la sobrecompra y la acumulación innecesaria de productos.</li>
            <li><b>Mayor precisión:</b> Mantiene un control exacto del stock, reduciendo errores en el inventario.</li>
            <li><b>Mejor respuesta a la demanda:</b> Permite disponer de productos para satisfacer rápidamente las necesidades del cliente.</li>
            <li><b>Eficiencia operativa:</b> Facilita la organización del almacén y la gestión de pedidos y devoluciones.</li>
          </ul>
      <hr />
        <p><b>👥 ¿CÓMO INTERACTÚAN LOS USUARIOS CON LA GESTIÓN DE INVENTARIOS?</b></p>
          <ul>
            <li><b>Administradores:</b>
              <ul>
                <li>Supervisan el inventario.</li>
                <li>Gestionan los niveles de stock.</li>
                <li>Ordenan la reposición de productos.</li>
              </ul>
            </li>
            <li><b>Almacén / Logística:</b>
              <ul>
                <li>Reciben y almacenan los productos.</li>
                <li>Organizan y despachan los productos según las órdenes.</li>
              </ul>
            </li>
            <li><b>Clientes:</b>
              <ul>
                <li>Consultan el inventario para verificar la disponibilidad de productos.</li>
                <li>Realizan compras sin inconvenientes.</li>
              </ul>
            </li>
          </ul>
      <hr />
      </div>
      <h2>Listado de Productos</h2>
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