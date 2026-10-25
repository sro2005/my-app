import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext'; // Importar el contexto de autenticación
import moment from 'moment-timezone';
import { Link } from 'react-router-dom';

// Función para formatear el precio en formato local (COP)
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(price) || 0);
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

const formatPaymentMethod = (pedido, isAdmin) => {
  if (pedido.paymentStatus === 'SIMULATED') return isAdmin ? 'Sin pago' : 'Pedido sin cobro';
  if (pedido.paymentMethod === 'Wompi') return isAdmin ? 'Wompi Sandbox' : 'Wompi';
  return pedido.paymentMethod || 'No especificado';
};

const formatPaymentStatus = (status, isAdmin) => {
  const adminLabels = {
    SIMULATED: 'Sin pago',
    APPROVED: 'Aprobado (Sandbox)',
    PENDING: 'Pendiente (Sandbox)',
    DECLINED: 'Rechazado (Sandbox)',
    ERROR: 'Error de pago (Sandbox)',
    EXPIRED: 'Checkout vencido · pedido cancelado y stock liberado',
    VOIDED: 'Anulado (Sandbox)'
  };
  const customerLabels = {
    SIMULATED: 'Sin cobro',
    APPROVED: 'Resultado recibido · sin cobro real',
    PENDING: 'Pendiente de verificar · sin cobro',
    DECLINED: 'No aprobado · sin cobro',
    ERROR: 'No fue posible verificarlo · sin cobro',
    EXPIRED: 'Sesión vencida · pedido cancelado, sin cobro',
    VOIDED: 'Pago anulado · sin cobro'
  };
  return (isAdmin ? adminLabels : customerLabels)[status] || status || 'No disponible';
};

const PedidoItem = ({ pedido, isAdmin, updating, onStatusUpdate }) => (
  <li className="pedido-item">
    <div className="pedido-info">
      <div className="pedido-image">
        <img src="/icono-order.jpg" alt="" />
      </div>
      <div className="pedido-details">
        <div className="evh-order-card-heading">
          <div className="evh-order-card-title">
            <span>PEDIDO</span>
            <h2>#{String(pedido._id || '').slice(-8).toUpperCase()}</h2>
          </div>
          <div className="evh-order-card-state">
            <span className={`evh-order-status ${pedido.delivered || pedido.status === 'Entregado' ? 'is-delivered' : pedido.status === 'Enviado' ? 'is-shipped' : pedido.status === 'Procesando' ? 'is-processing' : 'is-neutral'}`}>{pedido.status || 'Sin estado'}</span>
            <strong>{formatPrice(pedido.totalAmount)}</strong>
            <small>{isAdmin ? 'Valor del pedido' : 'Total del pedido'}</small>
          </div>
        </div>
        <p><strong>ID del pedido:</strong> {pedido._id || 'No disponible'}</p>
        <p><strong>{isAdmin ? 'Cliente:' : 'Titular del pedido:'}</strong> {pedido.firstName || ''} {pedido.lastName || ''}</p>
        <p><strong>Dirección de entrega:</strong> {pedido.address || 'No disponible'}</p>
        <p><strong>Teléfono de contacto:</strong> {pedido.phone || 'No disponible'}</p>
        <p><strong>Método de pago:</strong> {formatPaymentMethod(pedido, isAdmin)}</p>
        <p><strong>Estado del pago:</strong> {formatPaymentStatus(pedido.paymentStatus, isAdmin)}</p>
        <p><strong>Fecha del pedido:</strong> {formatOrderDate(pedido.orderDate)}</p>
        <p><strong>Entrega estimada:</strong> {formatDeliveryDate(pedido.deliveryDate)}</p>
        <p><strong>Productos:</strong>  
          {Array.isArray(pedido.products) && pedido.products.length > 0 ? pedido.products.map((item, index) => (
            <span key={item._id || item.productId?._id || index}>
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
  const [statusMessageType, setStatusMessageType] = useState('success');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('authToken');
      const userId = user?._id;  // Acceder al id del usuario desde el contexto
      const API_URL = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
      setError(null);
      setStatusMessage('');
      setLoading(true);
  
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
  
  }, [user, retryCount]);  // Recarga cuando cambia el usuario o se solicita un reintento.

  const handleStatusUpdate = async (orderId, field) => {
    const API_URL = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
    const token = localStorage.getItem('authToken');
    if (!API_URL || !token) {
      setStatusMessageType('error');
      setStatusMessage('No se pudo verificar la conexión o la sesión de administración.');
      return;
    }

    setUpdatingOrderId(orderId);
    setStatusMessage('');
    setStatusMessageType('success');
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
      setStatusMessageType('error');
      setStatusMessage(requestError.response?.data?.message || 'No se pudo actualizar el estado. Vuelve a intentarlo.');
    } finally {
      setUpdatingOrderId(null);
    }
  };
  

  const isAdmin = user?.role === 'admin';

  return (
    <main className={`container evh-orders-page ${isAdmin ? 'is-admin' : 'is-customer'}`}>
      <header className="evh-orders-heading">
        <span className="evh-eyebrow">{isAdmin ? 'ADMINISTRACIÓN · PEDIDOS' : 'TU CUENTA ELECTROVIBE'}</span>
        <h1>{isAdmin ? 'Gestión de pedidos' : 'Mis pedidos'}</h1>
        <p>{isAdmin
          ? 'Consulta los pedidos registrados, verifica su estado y gestiona las etapas de preparación y entrega. Wompi está configurado en modo Sandbox.'
          : 'Consulta los pedidos asociados a tu cuenta, revisa los productos y sigue el estado de cada solicitud.'}</p>
      </header>

      {isAdmin && !loading && !error && (
        <section className="evh-order-stats" aria-label="Resumen operativo de pedidos">
          <article className="evh-order-stat">
            <span>Total de pedidos</span>
            <strong>{pedidos.length}</strong>
            <small>Registros disponibles</small>
          </article>
          <article className="evh-order-stat is-processing">
            <span>En preparación</span>
            <strong>{pedidos.filter(item => item.status === 'Procesando').length}</strong>
            <small>Pendientes del siguiente paso</small>
          </article>
          <article className="evh-order-stat is-shipped">
            <span>En camino</span>
            <strong>{pedidos.filter(item => item.status === 'Enviado' && !item.delivered).length}</strong>
            <small>Marcados como enviados</small>
          </article>
          <article className="evh-order-stat is-delivered">
            <span>Entregados</span>
            <strong>{pedidos.filter(item => item.delivered || item.status === 'Entregado').length}</strong>
            <small>Pedidos finalizados</small>
          </article>
        </section>
      )}

      <section className="evh-orders-content" aria-label={isAdmin ? 'Pedidos registrados' : 'Historial de mis pedidos'} aria-busy={loading}>
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
            <button type="button" className="evh-button evh-button-primary" onClick={() => setRetryCount(value => value + 1)}>Reintentar</button>
          </div>
        ) : (
          <>
        {statusMessage && <p role={statusMessageType === 'error' ? 'alert' : 'status'} className={`order-status-feedback is-${statusMessageType}`}>{statusMessage}</p>}
        {emptyOrders ? (
          <div className="evh-orders-empty">
            <span aria-hidden="true">▤</span>
            <h2>{isAdmin ? 'Aún no hay pedidos registrados' : 'Aún no tienes pedidos'}</h2>
            <p>{isAdmin
              ? 'Los nuevos pedidos aparecerán aquí para consultar su estado y gestionar su seguimiento.'
              : 'Explora el catálogo y prepara tu primer pedido. Podrás revisar los productos y los detalles antes de confirmarlo.'}</p>
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
              <li className="evh-list-no-results">No hay pedidos disponibles.</li>
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