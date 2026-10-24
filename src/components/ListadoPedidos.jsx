import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext'; // Importar el contexto de autenticación
import moment from 'moment-timezone';
import { Link } from 'react-router-dom';

// Función para formatear el precio en formato local (COP)
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);
};

// Función para formatear la fecha en formato 12 horas con AM/PM
const formatOrderDate = (dateString) => {
  if (!dateString || !moment(dateString).isValid()) return 'No disponible';
  return moment(dateString).tz('America/Bogota').format('DD/MM/YYYY · HH:mm');
};

// Función para formatear la fecha estimada de entrega
const formatDeliveryDate = (deliveryDate) => {
  if (!deliveryDate || !moment(deliveryDate).isValid()) return 'No definida';
  return moment(deliveryDate).tz('America/Bogota').format('DD/MM/YYYY');
};

const formatPaymentMethod = (pedido) => {
  if (pedido.paymentStatus === 'SIMULATED') return 'Simulación interna · sin cobro';
  if (pedido.paymentMethod === 'Wompi') return 'Wompi Sandbox · entorno de prueba';
  return pedido.paymentMethod || 'No especificado';
};

const formatPaymentStatus = (status) => ({
  SIMULATED: 'Simulado · sin cobro real',
  APPROVED: 'Aprobado en entorno de prueba',
  PENDING: 'Pendiente en entorno de prueba',
  DECLINED: 'Rechazado en entorno de prueba',
  ERROR: 'Error en entorno de prueba'
}[status] || status || 'No disponible');

const PedidoItem = ({ pedido, isAdmin, updating, onStatusUpdate }) => (
  <li className="pedido-item">
    <div className="pedido-info">
      <div className="pedido-image">
        <img src="/icono-order.jpg" alt="Icono de pedido" />
      </div>
      <div className="pedido-details">
        <p><strong>🆔 ID del Pedido:</strong> {pedido._id}</p>
        <p><strong>{isAdmin ? 'Cliente' : 'Titular del pedido'}:</strong> {pedido.firstName} {pedido.lastName}</p>
        <p><strong>🏠 Dirección del Domicilio:</strong> {pedido.address}</p>
        <p><strong>📞 Número de Contacto:</strong> {pedido.phone || 'No disponible'}</p>
        <p><strong>Medio de prueba:</strong> {formatPaymentMethod(pedido)}</p>
        <p><strong>Estado del pago de prueba:</strong> {formatPaymentStatus(pedido.paymentStatus)}</p>
        <p><strong>📅 Fecha del Pedido:</strong> {formatOrderDate(pedido.orderDate)}</p>
        <p><strong>🚛 Fecha Estimada de Entrega:</strong> {formatDeliveryDate(pedido.deliveryDate)}</p>
        <p><strong>💰 Monto Total:</strong> {formatPrice(pedido.totalAmount)}</p>
        <p><strong>📦 Estado del Pedido:</strong> {pedido.status}</p>
        <p><strong>🛍️ Producto Escogido: </strong> 
          {Array.isArray(pedido.products) && pedido.products.length > 0 ? pedido.products.map((item, index) => (
            <span key={index}>
              {item.productId?.name || "Producto desconocido"} · {item.productId?.category || "Sin categoría"} · Cantidad: {item.quantity || 1}
              {index < pedido.products.length - 1 ? ', ' : ''}
            </span>
          )) : " No hay productos en este pedido."}
        </p>
        {isAdmin && pedido.status === 'Procesando' && pedido.paymentConfirmed && !pedido.packed && (
          <button type="button" disabled={updating} onClick={() => onStatusUpdate(pedido._id, 'packed')}>
            {updating ? 'Actualizando…' : 'Marcar preparado y enviado'}
          </button>
        )}
        {isAdmin && pedido.status === 'Enviado' && pedido.packed && !pedido.delivered && (
          <button type="button" disabled={updating} onClick={() => onStatusUpdate(pedido._id, 'delivered')}>
            {updating ? 'Actualizando…' : 'Marcar como entregado'}
          </button>
        )}
      </div>
    </div>
  </li>
);

const ListadoPedidos = () => {
  const { user } = useContext(AuthContext);  // Usar el contexto para obtener el usuario
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emptyOrders, setEmptyOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

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
          : '/api/orders/my-orders'; // Obtener pedidos del cliente autenticado
    
        const response = await axios.get(`${API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.data && Array.isArray(response.data)) {
          setPedidos(response.data);
          setEmptyOrders(response.data.length === 0);
        } else {
          setPedidos([]);
          setEmptyOrders(true);
        }        
  
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

  const handleStatusUpdate = async (orderId, field) => {
    const API_URL = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
    const token = localStorage.getItem('authToken');
    if (!API_URL || !token) {
      setStatusMessage('No se pudo verificar la conexión o la sesión de administración.');
      return;
    }

    setUpdatingOrderId(orderId);
    setStatusMessage('');
    try {
      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        { [field]: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = response.data?.order;
      if (updated) {
        setPedidos(current => current.map(item => item._id === orderId ? {
          ...item,
          status: updated.status,
          packed: updated.packed,
          delivered: updated.delivered,
          paymentStatus: updated.paymentStatus,
          paymentConfirmed: updated.paymentConfirmed
        } : item));
      }
      setStatusMessage(response.data?.message || 'Estado del pedido actualizado.');
    } catch (requestError) {
      setStatusMessage(requestError.response?.data?.message || 'No se pudo actualizar el estado. Vuelve a intentarlo.');
    } finally {
      setUpdatingOrderId(null);
    }
  };
  

  const isAdmin = user?.role === 'admin';

  return (
    <main className={`container evh-orders-page ${isAdmin ? 'is-admin' : 'is-customer'}`}>
      <header className="evh-orders-heading">
        <span className="evh-eyebrow">{isAdmin ? 'CENTRO DE CONTROL · DEMOSTRACIÓN' : 'TU CUENTA ELECTROVIBE'}</span>
        <h1>{isAdmin ? 'Gestión de pedidos' : 'Mis pedidos'}</h1>
        <p>{isAdmin
          ? 'Consulta pedidos de prueba y revisa su estado para ensayar el flujo operativo. Los importes son ilustrativos y no representan ventas ni cobros reales.'
          : 'Aquí puedes revisar los pedidos de demostración asociados a tu cuenta. Los importes son ilustrativos y este recorrido no genera pagos ni entregas reales.'}</p>
      </header>

      <section className="evh-orders-content" aria-label={isAdmin ? 'Pedidos de demostración' : 'Historial de mis pedidos'} aria-busy={loading}>
        {loading ? (
          <div className="evh-loading-panel evh-orders-loading" role="status" aria-live="polite">
            <div className="evh-loading-mark" aria-hidden="true">EV</div>
            <div className="evh-loading-copy">
              <span className="evh-loading-kicker">ELECTROVIBEHOME</span>
              <h2>{isAdmin ? 'Preparando el centro de pedidos' : 'Consultando tus pedidos'}</h2>
              <p>Estamos organizando la información para que puedas revisarla con claridad.</p>
              <div className="evh-loading-lines" aria-hidden="true"><span /><span /><span /></div>
            </div>
          </div>
        ) : error ? (
          <div className="evh-list-state is-error" role="alert">
            <span className="evh-list-state-icon" aria-hidden="true">!</span>
            <h2>No pudimos cargar los pedidos</h2>
            <p>{error}</p>
          </div>
        ) : (
          <>
        {statusMessage && <p role="status" className="order-status-feedback">{statusMessage}</p>}
        {emptyOrders ? (
          <div className="evh-orders-empty">
            <span aria-hidden="true">▤</span>
            <h2>{isAdmin ? 'Aún no hay pedidos de prueba' : 'Aún no has realizado ningún pedido de demostración'}</h2>
            <p>{isAdmin
              ? 'Cuando se registre un pedido ficticio en este entorno, aparecerá aquí para que puedas consultar su estado.'
              : 'Explora el catálogo y prueba el recorrido de compra con datos ilustrativos, sin usar dinero real.'}</p>
            {!isAdmin && <Link className="evh-button evh-button-primary" to="/catalogo">Explorar catálogo <span aria-hidden="true">→</span></Link>}
          </div>
        ) : (
          <ul className="pedidos-list">
            {pedidos.length > 0 ? (
              pedidos.map((pedido) => (
                <PedidoItem
                  key={pedido._id}
                  pedido={pedido}
                  isAdmin={isAdmin}
                  updating={updatingOrderId === pedido._id}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))
            ) : (
              <p>No hay pedidos disponibles.</p>
            )}
          </ul>
        )}
          </>
        )}
      </section>
    </main>
  );
}

export default ListadoPedidos;