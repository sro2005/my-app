import LoadingBrandMark from './LoadingBrandMark';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { formatBogotaDateTime } from '../utils/dateFormatting';
import { formatCop as formatMoney } from '../utils/currency';
import GenderAvatar from './GenderAvatar';

const normalizeSearchValue = value => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es-CO')
  .replace(/[^\p{L}\p{N}]/gu, '');

// Función para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return 'No disponible';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'No disponible';
  return [
    String(date.getUTCDate()).padStart(2, '0'),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCFullYear())
  ].join('/');
};

// Función para formatear fecha y hora
const formatDateTime = (dateString) => {
  if (!dateString) return 'Sin actividad registrada';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Sin actividad registrada';
  const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Bogota' };
  const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Bogota' };
  return `${date.toLocaleDateString('es-CO', dateOptions)} · ${date.toLocaleTimeString('es-CO', timeOptions)}`;
};

// Los pedidos se muestran con la hora local de Bogotá.
const formatOrderDate = (dateString) => formatBogotaDateTime(dateString, {
  fallback: 'Fecha no disponible',
  includeSeconds: true,
  separator: ' - '
});

// Formatear número de identificación
const formatIdentificationNumber = (number) => {
  const value = String(number ?? '').trim();
  return value ? value.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : 'No disponible';
};

// Calcular estado del cliente
const calcularEstado = (lastActivityDate) => {
  if (!lastActivityDate) return false;
  const activity = new Date(lastActivityDate);
  if (Number.isNaN(activity.getTime()) || activity.getTime() > Date.now()) return false;
  const diferenciaEnDias = (Date.now() - activity.getTime()) / (1000 * 60 * 60 * 24);
  return diferenciaEnDias <= 30; // Activo si la última actividad fue hace menos de 30 días
};

const formatPaymentStatus = status => ({
  PENDING: 'Pendiente de revisión',
  APPROVED: 'Pago confirmado',
  DECLINED: 'Pago rechazado'
})[status] || 'Estado no disponible';

// Componente para mostrar cada cliente
const ClienteItem = ({ cliente }) => {
  const estadoActivo = calcularEstado(cliente.lastActivityDate) ? 'Activo' : 'Inactivo';
  
  // Verificar si 'orders' es un array antes de contar los pedidos
  const pedidosCount = Array.isArray(cliente.orders) ? cliente.orders.length : 0;

  return (
    <li className={`cliente-item ${estadoActivo === 'Inactivo' ? 'inactivo' : ''}`}>
      <div className="cliente-info">
        <div className={`cliente-avatar cliente-avatar--${cliente.gender || 'unspecified'}`}>
          <GenderAvatar gender={cliente.gender} size="customer" />
        </div>
        <div className="cliente-details">
          <p><strong>Cliente:</strong> {cliente.firstName} {cliente.lastName || ''}</p>
          <p><strong>Correo electrónico:</strong> {cliente.email || 'No disponible'}</p>
          <p><strong>Teléfono de contacto:</strong> {cliente.phone || 'No disponible'}</p>
          <p><strong>Número de identificación:</strong> {formatIdentificationNumber(cliente.identificationNumber)}</p>
          <p><strong>Fecha de nacimiento:</strong> {formatDate(cliente.birthDate)}</p>
          <p><strong>Historial de Pedidos:</strong> {pedidosCount} {pedidosCount === 1 ? 'Pedido' : 'Pedidos'}</p>
          {pedidosCount > 0 && (
            <details className="cliente-historial-pedidos">
              <summary>Ver Historial de Pedidos ({pedidosCount})</summary>
              <ul>
                {cliente.orders.map(pedido => (
                  <li key={pedido._id}>
                    <strong>Pedido #{String(pedido._id).slice(-8)}</strong>
                    <span>Fecha: {formatOrderDate(pedido.orderDate)}</span>
                    <span>Estado: {pedido.status || 'Sin estado'}</span>
                    <span>Pago: {formatPaymentStatus(pedido.paymentStatus)}</span>
                    <span>Valor del pedido: {formatMoney(pedido.totalAmount)}</span>
                    {Array.isArray(pedido.products) && pedido.products.length > 0 && (
                      <ul>
                        {pedido.products.map((item, index) => (
                          <li key={item._id || item.productId?._id || index}>
                            {item.productId?.name || 'Producto del historial'} × {item.quantity || 1}
                            {item.productId?.category ? ` · ${item.productId.category}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p><strong>Última interacción:</strong> {formatDateTime(cliente.lastActivityDate)}</p>
          <p><strong>Estado:</strong> {estadoActivo}</p>
        </div>
      </div>
    </li>
  );
};

// Componente principal para la lista de clientes
const ListadoClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filtroActivo, setFiltroActivo] = useState(null);

  const token = localStorage.getItem('authToken');

  // Función para obtener clientes
  const fetchClientes = useCallback(async () => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    if (!API_URL || !token) {
      setError(!API_URL ? 'La variable API_URL no está configurada.' : 'Token no encontrado.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/customers/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!Array.isArray(response.data)) throw new Error('Formato inesperado del servidor');
      setClientes(response.data.filter(cliente => cliente.role === 'user'));
    } catch (error) {
      setError(`Error al obtener los clientes: ${error.response?.data?.message || 'Intenta nuevamente más tarde.'}`);
    } finally {
      setLoading(false);
    }
  }, [token]);



  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Filtrar clientes según el texto de búsqueda y el filtro activo
  const clientesFiltrados = useMemo(() => {
    const searchNormalized = normalizeSearchValue(search);
    return clientes
      .filter(cliente => [
        cliente._id,
        cliente.email,
        cliente.firstName,
        cliente.lastName,
        [cliente.firstName, cliente.lastName].filter(Boolean).join(' '),
        cliente.phone,
        cliente.identificationNumber
      ].some(value => normalizeSearchValue(value).includes(searchNormalized)))
      .filter(cliente => filtroActivo === null || calcularEstado(cliente.lastActivityDate) === filtroActivo)
      .sort((a, b) =>
        String(a.lastName || '').localeCompare(String(b.lastName || ''), 'es', { sensitivity: 'base' }) ||
        String(a.firstName || '').localeCompare(String(b.firstName || ''), 'es', { sensitivity: 'base' })
      );
  }, [clientes, search, filtroActivo]);

  // Calcular estadísticas basadas en los clientes filtrados
  const { activos, inactivos, pedidosTotales, clienteMasPedidos, ultimoPedido } = useMemo(() => {
    // Cantidad de clientes activos
    const activosCount = clientesFiltrados.filter(cliente => calcularEstado(cliente.lastActivityDate)).length;
    const inactivosCount = clientesFiltrados.length - activosCount;
    
    // Total de pedidos de todos los clientes filtrados
    const pedidosTotalesCount = clientesFiltrados.reduce((total, cliente) => total + (cliente.orders?.length || 0), 0);
    
    // Determinar el cliente con más pedidos
    let clienteConMasPedidos = null;
    if (clientesFiltrados.length > 0) {
      clienteConMasPedidos = clientesFiltrados.reduce((max, cliente) =>
        (cliente.orders?.length || 0) > (max.orders?.length || 0) ? cliente : max,
        clientesFiltrados[0]
      );
    }
    const clienteMasPedidosResult =
      (clienteConMasPedidos && (clienteConMasPedidos.orders?.length || 0) > 0)
        ? clienteConMasPedidos
        : null;
    
    // Determinar el último pedido de todos los clientes filtrados
    const ordersArray = clientes.flatMap(cliente => Array.isArray(cliente.orders) ? cliente.orders : []);
    let ultimoPedidoFormatted = "No hay pedidos disponibles";
    if (ordersArray.length > 0) {
      ordersArray.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      ultimoPedidoFormatted = formatOrderDate(ordersArray[0].orderDate);
    }
    
    return {
      activos: activosCount,
      inactivos: inactivosCount,
      pedidosTotales: pedidosTotalesCount,
      clienteMasPedidos: clienteMasPedidosResult,
      ultimoPedido: ultimoPedidoFormatted
    };
  }, [clientes]);

  const topClientOrderCount = clienteMasPedidos?.orders?.length || 0;

  return (
    <main className="evh-admin-customers" aria-busy={loading}>
      <header className="evh-admin-customers-heading">
        <span className="evh-eyebrow">ADMINISTRACIÓN · CLIENTES</span>
        <h1>Gestión de Clientes</h1>
        <p>Consulta clientes registrados, su actividad reciente y el historial de pedidos asociados.</p>
      </header>

      {loading ? (
        <div className="evh-loading-panel evh-customers-loading" role="status" aria-live="polite">
          <div className="evh-loading-mark" aria-hidden="true"><LoadingBrandMark /></div>
          <div className="evh-loading-copy">
            <span className="evh-loading-kicker">ELECTROVIBEHOME</span>
            <h2>Preparando el directorio de clientes</h2>
            <p>Estamos ordenando los perfiles y su actividad reciente.</p>
            <div className="evh-loading-lines" aria-hidden="true"><span /><span /><span /></div>
          </div>
        </div>
      ) : error ? (
        <div className="evh-list-state is-error" role="alert">
          <span className="evh-list-state-icon" aria-hidden="true">!</span>
          <h2>No pudimos cargar los clientes</h2>
          <p>{error}</p>
          <button type="button" onClick={fetchClientes}>Reintentar</button>
        </div>
      ) : (
        <>
      <div className="evh-customers-toolbar">
      <div className="search-container">
        <input type="search" aria-label="Buscar clientes por nombre, correo, teléfono o identificación" placeholder="Buscar por nombre, correo, teléfono o identificación…" 
          value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
      </div>

      <div className="filters-container" aria-label="Filtrar clientes por actividad">
        <button type="button" aria-pressed={filtroActivo === null} onClick={() => setFiltroActivo(null)}>Todos</button>
        <button type="button" aria-pressed={filtroActivo === true} onClick={() => setFiltroActivo(true)}>Activos</button>
        <button type="button" aria-pressed={filtroActivo === false} onClick={() => setFiltroActivo(false)}>Inactivos</button>
        {(search.trim() || filtroActivo !== null) && <button type="button" className="evh-filter-reset" onClick={() => { setSearch(''); setFiltroActivo(null); }}>Limpiar Filtros</button>}
      </div>
      </div>

      <div className="dashboard-container">
        <div className="dashboard-card">
          <h2>📊 Resumen de Clientes</h2>
          <div className="client-stats">
            <div className="stat-item">
              <h3>Total de Clientes</h3>
              <p>{clientes.length}</p>
            </div>
            <div className="stat-item active">
              <h3>Clientes Activos</h3>
              <p>{activos}</p>
            </div>
            <div className="stat-item inactive">
              <h3>Clientes Inactivos</h3>
              <p>{inactivos}</p>
            </div>
            <div className="stat-item">
              <h3>Pedidos Registrados</h3>
              <p>{pedidosTotales}</p>
            </div>
            <div className="stat-item">
              <h3>Último Pedido</h3>
              <p>{ultimoPedido}</p>
            </div>
            <div className="stat-item top-client">
              <h3>Cliente con Más Pedidos</h3>
              {clienteMasPedidos ? (
                <p>{clienteMasPedidos.firstName} {clienteMasPedidos.lastName} ({topClientOrderCount} {topClientOrderCount === 1 ? 'Pedido' : 'Pedidos'})</p>
              ) : (
                <p>No se encontró un cliente con más pedidos.</p>
              )}
          </div>
        </div>
      </div>
    </div>

    <div className="evh-customers-list-heading">
      <h2>Directorio de Clientes</h2>
      <span>{clientesFiltrados.length} {clientesFiltrados.length === 1 ? 'Resultado' : 'Resultados'}</span>
    </div>
    {clientesFiltrados.length > 0 ? (
      <ul className="clientes-list">
        {clientesFiltrados.map(cliente => (
          <ClienteItem key={cliente._id} cliente={cliente} />
        ))}
      </ul>
    ) : (
      <div className="evh-orders-empty evh-customers-empty">
        <span aria-hidden="true">⌕</span>
        <h2>{clientes.length === 0 ? 'Aún no hay clientes registrados' : 'No hay clientes que coincidan'}</h2>
        <p>{clientes.length === 0 ? 'Los clientes registrados aparecerán aquí.' : 'Intenta con otro término de búsqueda o cambia el filtro de actividad.'}</p>
        {(search.trim() || filtroActivo !== null) && <button type="button" className="evh-button evh-button-primary" onClick={() => { setSearch(''); setFiltroActivo(null); }}>Restablecer Filtros</button>}
      </div>
   )}
        </>
      )}
    </main>
  );
};

export default ListadoClientes;