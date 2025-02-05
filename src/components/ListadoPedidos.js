import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import ClipLoader from 'react-spinners/ClipLoader'; // Importar el spinner
import { AuthContext } from '../contexts/AuthContext'; // Importar el contexto de autenticación
import moment from 'moment-timezone';

// Función para formatear el precio en formato local (COP)
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);
};

// Función para formatear la fecha en formato 12 horas con AM/PM
const formatOrderDate = (dateString) => {
  return moment(dateString).tz('America/Bogota').format('DD/MM/YYYY - HH:mm:ss'); // Hora en formato militar (24 horas)
};

// Función para formatear la fecha estimada de entrega
const formatDeliveryDate = (deliveryDate) => {
  return moment(deliveryDate).tz('America/Bogota').format('DD/MM/YYYY'); // 12 horas con AM/PM
};

const PedidoItem = ({ pedido }) => (
  <li className="pedido-item">
    <div className="pedido-info">
      <div className="pedido-image">
        <img src="/icono-order.jpg" alt="Icono de pedido" />
      </div>
      <div className="pedido-details">
        <p><strong>🆔 ID del Pedido:</strong> {pedido._id}</p>
        <p><strong>🙍‍♂️ Nombre del Cliente:</strong> {pedido.firstName} {pedido.lastName}</p>
        <p><strong>🏠 Dirección del Domicilio:</strong> {pedido.address}</p>
        <p><strong>📞 Número de Contacto:</strong> {pedido.phone || 'No disponible'}</p>
        <p><strong>💳 Método de Pago:</strong> {pedido.paymentMethod || 'No especificado'}</p>
        <p><strong>📅 Fecha del Pedido:</strong> {formatOrderDate(pedido.orderDate)}</p>
        <p><strong>🚛 Fecha Estimada de Entrega:</strong> {formatDeliveryDate(pedido.deliveryDate)}</p>
        <p><strong>💰 Monto Total:</strong> {formatPrice(pedido.totalAmount)}</p>
        <p><strong>📦 Estado del Pedido:</strong> {pedido.status}</p>
        <p><strong>🛍️ Producto Escogido: </strong> 
          {pedido.products.length > 0 ? pedido.products.map((item, index) => (
            <span key={index}>
              {item.productId?.name || "Producto desconocido"} -  Cantidad: ({item.quantity})
              {index < pedido.products.length - 1 ? ', ' : ''}
            </span>
          )) : " No hay productos en este pedido."}
        </p>
      </div>
    </div>
  </li>
);

const ListadoPedidos = () => {
  const { user } = useContext(AuthContext);  // Usar el contexto para obtener el usuario
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('authToken');
      const userId = user?._id;  // Acceder al id del usuario desde el contexto
      const API_URL = process.env.REACT_APP_API_BASE_URL;

      if (!token || !userId || !API_URL) {
        setError('Faltan datos esenciales: URL de API, token o userId.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const isAdmin = user?.role === 'admin'; // Obtener el rol del usuario desde el contexto
        const endpoint = isAdmin 
          ? '/api/orders/all' // Admin ve todos los pedidos
          : `/api/orders/user/${userId}`; // Obtener pedidos por userId
  
        const response = await axios.get(`${API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setPedidos(response.data);
      } catch (err) {
        setError('Hubo un error al obtener los pedidos. Intente nuevamente más tarde.');
      } finally {
        setLoading(false);
      }
    };

    // Solo realizar la solicitud si el usuario está disponible
    if (user && user._id) {
      fetchOrders();
    } else {
      setError('Usuario no autenticado o datos de usuario inválidos.');
      setLoading(false);
    }

  }, [user]);  // Dependencia de `user` para que se ejecute cada vez que cambie

  // Mostrar el spinner de carga mientras se obtienen los datos
  if (loading) {
    return (
      <div className="spinner-container">
        <ClipLoader size={50} color="#FFA500" />
      </div>
    );
  }

  // Si ocurre un error, mostrar un mensaje de error
  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Gestión de Pedidos</h2>
      <hr />
      <p><strong>📖 DEFINICIÓN:</strong> La <strong>Gestión de Pedidos</strong> en <strong>ElectroVibeHome</strong> es el proceso mediante el cual se <strong>reciben, procesan y entregan</strong> electrodomésticos y productos tecnológicos a nuestros clientes de manera <strong>organizada, segura y eficiente.</strong></p>
        <ul>
          <li>Captura de información del cliente.</li>
          <li>Validación del pedido.</li>
          <li>Procesamiento del pago.</li>
          <li>Preparación del producto para su envío.</li>
          <li>Entrega final.</li>
        </ul>
      <hr />
      <p><b>🎯 OBJETIVO:</b> Asegurar que cada pedido se procese correctamente, sin errores ni retrasos, garantizando que el cliente reciba su compra en el tiempo esperado y en las condiciones adecuadas.</p>
      <hr />
      <p><b>📈 IMPORTANCIA:</b></p>
        <ul>
          <li><b>Optimización del flujo de trabajo:</b> Permite manejar múltiples pedidos simultáneamente sin confusiones.</li>
          <li><b>Mejora en la satisfacción del cliente:</b> Reduce tiempos de espera y mejora la experiencia de usuario.</li>
          <li><b>Control y trazabilidad:</b> Cada pedido tiene un estado actualizado, permitiendo su seguimiento en tiempo real.</li>
          <li><b>Reducción de errores:</b> Minimiza problemas como envíos incorrectos, productos agotados o pagos fallidos.</li>
        </ul>
      <hr />
      <p><b>🔍 PROCESO DE GESTIÓN DE PEDIDOS:</b></p>
        <ol>
          <li><b>Recepción del pedido:</b> El cliente selecciona los productos y genera la solicitud de compra en la plataforma.</li>
          <li><b>Validación:</b> Se verifica la disponibilidad de los productos y la información ingresada por el usuario.</li>
          <li><b>Procesamiento del pago:</b> Se confirma el pago a través de los métodos disponibles (tarjeta de crédito, débito, billeteras virtuales, etc.).</li>
          <li><b>Preparación del pedido:</b> Se organiza el producto en el almacén y se alista para el envío.</li>
          <li><b>Envió y entrega:</b> El pedido es enviado por un servicio de logística y entregado al cliente dentro del plazo estipulado.</li>
          <li><b>Confirmación y cierre:</b> El cliente recibe su pedido y puede calificar la experiencia de compra.</li>
        </ol>
      <hr />
      <p><b>🚀 BENEFICIOS DE UNA BUENA GESTIÓN DE PEDIDOS:</b></p>
        <ul>
          <li><b>Rapidez en el procesamiento:</b> Disminuye los tiempos de espera entre la compra y la entrega.</li>
          <li><b>Mayor confianza del cliente:</b> Transparencia en el estado del pedido y tiempos de entrega exactos.</li>
          <li><b>Reducción de costos operativos:</b> Optimiza los recursos logísticos y evita reprocesos innecesarios.</li>
          <li><b>Mejora en la gestión de inventarios:</b> Permite tener control de los productos disponibles y evitar sobreventas.</li>
        </ul>
      <hr />
      <p><b>👥 ¿CÓMO INTERACTÚAN LOS USUARIOS CON LA GESTIÓN DE PEDIDOS?</b></p>
        <ul>
          <li><b>Clientes:</b> Realizan pedidos, consultan el estado y reciben notificaciones de entrega.</li>
          <li><b>Administradores:</b> Gestionan los pedidos, verifican pagos, actualizan estados y resuelven incidencias.</li>
          <li><b>Almacén/Logística:</b> Reciben las órdenes, preparan los productos y coordinan el envío.</li>
        </ul>
      <hr />
      <h2>Listado de Pedidos</h2>
      <ul className="pedidos-list">
        {pedidos.length > 0 ? (
          pedidos.map((pedido) => <PedidoItem key={pedido._id} pedido={pedido} />)
        ) : (
          <p>No hay pedidos disponibles.</p>
        )}
      </ul>
    </div>
  );
};

export default ListadoPedidos;