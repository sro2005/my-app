import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';
import { AuthContext } from '../contexts/AuthContext';

const money = value => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
}).format(Number(value) || 0);

const formatPaymentStatus = status => ({
  SIMULATED: 'Sin pago',
  APPROVED: 'Aprobado (Sandbox)',
  PENDING: 'Pendiente (Sandbox)',
  DECLINED: 'Rechazado (Sandbox)',
  ERROR: 'Error de pago (Sandbox)',
  EXPIRED: 'Checkout vencido',
  VOIDED: 'Anulado (Sandbox)'
})[status] || status || 'Pendiente';

export const summarizeDemoOperations = (orders, customers, products) => {
  const simulated = orders.filter(order => order.paymentStatus === 'SIMULATED');
  const sandbox = orders.filter(order => order.paymentMethod === 'Wompi');
  return {
    customers: customers.filter(customer => customer.role === 'user').length,
    products: products.length,
    lowStock: products.filter(product => Number(product.quantity) <= 3).length,
    orders: orders.length,
    simulated: simulated.length,
    sandbox: sandbox.length,
    pending: orders.filter(order => ['Pendiente', 'Procesando'].includes(order.status)).length,
    simulatedValue: simulated.reduce((total, order) => total + (Number(order.totalAmount) || 0), 0)
  };
};

const AdminDashboard = () => {
  const auth = useContext(AuthContext);
  const adminEmail = auth?.user?.email || 'Cuenta de administración';
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const base = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
    const token = localStorage.getItem('authToken');
    if (!base || !token) {
      setError('No se pudo verificar la conexión o la sesión de administración.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [orderResponse, customerResponse, productResponse] = await Promise.all([
        axios.get(`${base}/api/orders/all`, config),
        axios.get(`${base}/api/customers/all`, config),
        axios.get(`${base}/api/products`, config)
      ]);
      if (![orderResponse.data, customerResponse.data, productResponse.data].every(Array.isArray)) {
        throw new Error('La API devolvió datos inesperados.');
      }
      setOrders(orderResponse.data);
      setCustomers(customerResponse.data);
      setProducts(productResponse.data);
    } catch (requestError) {
      setError(requestError.response?.status === 403
        ? 'Esta cuenta no tiene permisos de administrador.'
        : 'No fue posible cargar el resumen. Comprueba la conexión e inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const summary = useMemo(() => summarizeDemoOperations(orders, customers, products), [orders, customers, products]);
  const recent = useMemo(() => [...orders]
    .sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0)).slice(0, 6), [orders]);

  return (
    <main className="evh-admin">
      <header className="evh-admin-hero">
        <span className="evh-admin-eyebrow">PANEL DE ADMINISTRACIÓN · RESUMEN OPERATIVO</span>
        <h1>Tu tienda, bajo control.</h1>
        <p>Supervisa pedidos, clientes y productos desde un solo lugar. Wompi está configurado en modo Sandbox.</p>
        <div className="evh-admin-session" aria-label="Cuenta administrativa conectada">
          <span className="evh-admin-session-mark" aria-hidden="true">✓</span>
          <span className="evh-admin-session-copy"><small>SESIÓN DE ADMINISTRACIÓN</small><strong>{adminEmail}</strong></span>
          <span className="evh-admin-session-role">Administrador</span>
        </div>
        <button type="button" onClick={reload} disabled={loading}>Actualizar resumen</button>
      </header>
      {loading && (
        <div className="evh-loading-panel evh-admin-loading" role="status" aria-live="polite">
          <span className="evh-loading-mark" aria-hidden="true">EV</span>
          <div className="evh-loading-copy">
            <span className="evh-loading-kicker">CENTRO DE CONTROL</span>
            <h2>Actualizando el panel</h2>
            <p>Estamos reuniendo la información de pedidos, clientes e inventario.</p>
            <div className="evh-loading-lines" aria-hidden="true"><span /><span /><span /></div>
          </div>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && (
        <>
          <section aria-label="Indicadores de operación" className="evh-admin-stats">
            {[
              ['Clientes registrados', summary.customers],
              ['Total de pedidos', summary.orders],
              ['Pedidos sin pago', summary.simulated],
              ['Pedidos mediante Wompi Sandbox', summary.sandbox],
              ['Pedidos por gestionar', summary.pending],
              ['Productos del catálogo', summary.products],
              ['Productos con stock bajo (≤3)', summary.lowStock],
              ['Valor registrado en pedidos sin pago', money(summary.simulatedValue)]
            ].map(([label, value]) => (
              <article key={label} className="evh-admin-stat">
                <span>{label}</span><strong>{value}</strong>
              </article>
            ))}
          </section>
          <div className="evh-admin-grid">
            <section className="evh-admin-panel">
              <h2>Últimos pedidos</h2>
              {recent.length === 0 ? <p>Todavía no hay pedidos registrados en este entorno.</p> : (
                <div className="evh-admin-table-scroll">
                  <table>
                    <thead><tr><th scope="col">Cliente</th><th scope="col">Valor del pedido</th><th scope="col">Pago</th><th scope="col">Pedido</th></tr></thead>
                    <tbody>{recent.map(order => (
                      <tr key={order._id}>
                        <td data-label="Cliente"><span className="evh-admin-order-customer">{order.firstName} {order.lastName}<small>{order.email}</small></span></td>
                        <td data-label="Valor del pedido">{money(order.totalAmount)}</td>
                        <td data-label="Pago">{formatPaymentStatus(order.paymentStatus)}</td>
                        <td data-label="Pedido">{order.status || 'Sin estado'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              <Link to="/listado-pedidos">Gestionar todos los pedidos</Link>
            </section>
            <section className="evh-admin-panel">
              <h2>Accesos de administración</h2>
              <div className="evh-admin-actions">
                <Link to="/listado-clientes">Consultar clientes</Link>
                <Link to="/admin-inventario">Gestionar inventario</Link>
                <Link to="/producto-form">Agregar producto</Link>
                <Link to="/listado-pedidos">Gestionar estados de pedidos</Link>
              </div>
              <p>Los permisos se verifican en el servidor, no solo en el menú.</p>
            </section>
          </div>
        </>
      )}
    </main>
  );
};

export default AdminDashboard;
