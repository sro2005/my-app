import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import ClipLoader from 'react-spinners/ClipLoader';
import moment from 'moment-timezone';

// Función para formatear fechas
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
};

// Función para formatear fecha y hora
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'No hay Fecha Disponible';
  
  const formattedDate = date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Bogota' });

  return (
    <span className="fecha-hora">
      <span className="separador"> | </span>
      <span className="fecha">Fecha: {formattedDate}</span>
      <span className="separador"> | </span>
      <span className="hora">Hora: {formattedTime}</span>
      <span className="separador"> | </span>
    </span>
  );
};

// Función para formatear la fecha en formato 12 horas con AM/PM
const formatOrderDate = (dateString) => {
  return moment(dateString).tz('America/Bogota').format('DD/MM/YYYY - HH:mm:ss'); // Hora en formato militar (24 horas)
};

// Formatear número de identificación
const formatIdentificationNumber = (number) => number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// Calcular estado del cliente
const calcularEstado = (lastActivityDate) => {
  const diferenciaEnDias = (new Date() - new Date(lastActivityDate)) / (1000 * 60 * 60 * 24);
  return diferenciaEnDias <= 30; // Activo si la última actividad fue hace menos de 30 días
};

// Componente para mostrar cada cliente
const ClienteItem = ({ cliente }) => {
  const estadoActivo = calcularEstado(cliente.lastActivityDate) ? 'Activo' : 'Inactivo';
  
  // Verificar si 'orders' es un array antes de contar los pedidos
  const pedidosCount = Array.isArray(cliente.orders) ? cliente.orders.length : 0;

  return (
    <li className={`cliente-item ${estadoActivo === 'Inactivo' ? 'inactivo' : ''}`}>
      <div className="cliente-info">
        <div className="cliente-avatar">
          <img src="/icono-user.png" alt="Icono de Usuario" />
        </div>
        <div className="cliente-details">
          <p><strong>Cliente:</strong> {cliente.firstName} {cliente.lastName || ''}</p>
          <p><strong>Email:</strong> {cliente.email}</p>
          <p><strong>Celular:</strong> {cliente.phone}</p>
          <p><strong>Tipo & Número de Identificación (C.C):</strong> {formatIdentificationNumber(cliente.identificationNumber)}</p>
          <p><strong>Fecha de Nacimiento:</strong> {formatDate(cliente.birthDate)}</p>
          <p><strong>Historial de Pedidos:</strong> {pedidosCount} Pedido{pedidosCount === 1 ? '' : 's'}</p>
          <p><strong>Última Interacción:</strong> {formatDateTime(cliente.lastActivityDate)}</p>
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
    try {
      const response = await axios.get(`${API_URL}/api/customers/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClientes(response.data.filter(cliente => cliente.role === 'user'));
    } catch (error) {
      setError(`Error al obtener los clientes: ${error.response?.data?.message || 'Intente nuevamente más tarde.'}`);
    } finally {
      setLoading(false);
    }
  }, [token]);



  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Filtrar clientes según el texto de búsqueda y el filtro activo
  const clientesFiltrados = useMemo(() => {
    const searchLower = search.toLowerCase();
    return clientes
      .filter(cliente =>
        cliente._id.toLowerCase().includes(searchLower) ||
        cliente.email.toLowerCase().includes(searchLower)
      )
      .filter(cliente => filtroActivo === null || calcularEstado(cliente.lastActivityDate) === filtroActivo);
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
    const ordersArray = clientesFiltrados.flatMap(cliente => cliente.orders || []);
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
  }, [clientesFiltrados]);

  if (loading) return <div className="spinner-container"><ClipLoader size={50} color="#FFA500" /></div>;
  if (error) return <div className="error-message"><p>{error}</p></div>;

  return (
    <div className="container">
      <h2>Gestión de Clientes</h2>

      <div className="search-container">
        <input type="text" placeholder="🔍 Buscar por ID... / Buscar por E-MAIL..." 
          value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
      </div>

      <div className="filters-container">
        <button onClick={() => setFiltroActivo(null)}>Todos</button>
        <button onClick={() => setFiltroActivo(true)}>Activos</button>
        <button onClick={() => setFiltroActivo(false)}>Inactivos</button>
      </div>

      <div className="dashboard-container">
        <div className="dashboard-card">
          <h2>📊 Resumen de Clientes</h2>
          <div className="client-stats">
            <div className="stat-item">
              <h3>👥 TOTAL DE CLIENTES:</h3>
              <p>{clientesFiltrados.length}</p>
            </div>
            <div className="stat-item active">
              <h3>🟢 CLIENTES ACTIVOS:</h3>
              <p>{activos}</p>
            </div>
            <div className="stat-item inactive">
              <h3>🔴 CLIENTES INACTIVOS:</h3>
              <p>{inactivos}</p>
            </div>
            <div className="stat-item">
              <h3>📦 PEDIDOS TOTALES:</h3>
              <p>{pedidosTotales}</p>
            </div>
            <div className="stat-item">
              <h3>🕒 ÚLTIMO PEDIDO:</h3>
              <p>{ultimoPedido}</p>
            </div>
            <div className="stat-item top-client">
              <h3>🏆 CLIENTE CON MÁS PEDIDOS:</h3>
              {clienteMasPedidos ? (
                <p>{clienteMasPedidos.firstName} {clienteMasPedidos.lastName} ({clienteMasPedidos.orders?.length || 0} Pedidos)</p>
              ) : (
                <p>No se encontró un cliente con más pedidos.</p>
              )}
          </div>
        </div>
      </div>
    </div>

    <h2>Listado de Clientes</h2>
    {clientesFiltrados.length > 0 ? (
      <ul className="clientes-list">
        {clientesFiltrados.map(cliente => (
          <ClienteItem key={cliente._id} cliente={cliente} />
        ))}
      </ul>
    ) : (
      <p>No hay clientes disponibles.</p>
   )}
    </div>
)};

export default ListadoClientes;