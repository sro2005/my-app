import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

const money = value => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
}).format(Number(value) || 0);

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
        <span className="evh-admin-eyebrow">CENTRO DE CONTROL · ENTORNO DE DEMOSTRACIÓN</span>
        <h1>Tu tienda, bajo control.</h1>
        <p>Consulta los movimientos ficticios de ElectroVibeHome. Ninguna cifra representa ventas o dinero recibido.</p>
        <button type="button" onClick={reload} disabled={loading}>Actualizar datos</button>
      </header>
      {loading && <p role="status">Cargando información de administración…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && (
        <>
          <section aria-label="Resumen de demostración" className="evh-admin-stats">
            {[
              ['Clientes registrados', summary.customers],
              ['Pedidos de prueba', summary.orders],
              ['Compras internas simuladas', summary.simulated],
              ['Pedidos Wompi de prueba', summary.sandbox],
              ['Pedidos por gestionar', summary.pending],
              ['Productos del catálogo', summary.products],
              ['Productos con stock bajo (≤3)', summary.lowStock],
              ['Valor ficticio de compras internas', money(summary.simulatedValue)]
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
                    <thead><tr><th scope="col">Cliente</th><th scope="col">Importe ficticio</th><th scope="col">Pago</th><th scope="col">Pedido</th></tr></thead>
                    <tbody>{recent.map(order => (
                      <tr key={order._id}>
                        <td>{order.firstName} {order.lastName}<small>{order.email}</small></td>
                        <td>{money(order.totalAmount)}</td>
                        <td>{order.paymentStatus === 'SIMULATED' ? 'Simulado sin cobro' : order.paymentStatus || 'Pendiente'}</td>
                        <td>{order.status || 'Sin estado'}</td>
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
                <Link to="/producto-form">Agregar producto ficticio</Link>
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
