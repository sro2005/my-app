import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClipLoader from 'react-spinners/ClipLoader';

const formatDate = (dateString) => {
  const date = new Date(dateString); // Convierte la fecha a un objeto Date
  const day = date.getUTCDate().toString().padStart(2, '0'); // Obtiene el día en UTC
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Mes en UTC (0-indexado)
  const year = date.getUTCFullYear(); // Año en UTC

  return `${day}/${month}/${year}`;
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Fecha no válida';

  // Ajustar la fecha y hora para evitar discrepancias
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

  const dateOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,  // Formato de 24 horas (hora militar)
  };

  const formattedDate = date.toLocaleDateString('es-CO', dateOptions);
  const formattedTime = date.toLocaleTimeString('es-CO', timeOptions);

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

const formatIdentificationNumber = (number) => {
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const ClienteItem = ({ cliente }) => (
  <li className="cliente-item">
    <div className="cliente-info">
      <div className="cliente-avatar">
        <img src="/icono-user.png" alt="Icono de Usuario" />
      </div>
      <div className="cliente-details">
        <p><strong>Nombre:</strong> {cliente.firstName} {cliente.lastName}</p>
        <p><strong>Email:</strong> {cliente.email}</p>
        <p><strong>Celular:</strong> {cliente.phone}</p>
        <p><strong>Tipo & Número de Identificación: (C.C)</strong> {formatIdentificationNumber(cliente.identificationNumber)}</p>
        <p><strong>Fecha de Nacimiento:</strong> {formatDate(cliente.birthDate)}</p>
        <p><strong>Historial de Pedidos:</strong> {cliente.orders?.length || 0} Pedidos</p>
        <p><strong>Registrado:</strong> {formatDateTime(cliente.registrationDate)}</p>
        <p><strong>Preferencias:</strong> {cliente.preferences?.join(', ') || 'No especificadas'}</p>
        <p><strong>Estado:</strong> {cliente.status ? 'Inactivo' : 'Activo'}</p>
      </div>
    </div>
  </li>
);

const ListadoClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const token = localStorage.getItem('authToken');
  
  useEffect(() => {
    const fetchClientes = async () => {
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
        // Filtrar solo los clientes con rol 'user' y excluir los administradores
        const clientesFiltrados = response.data.filter(cliente => cliente.role === 'user');
        setClientes(clientesFiltrados);
      } catch {
        setError('Error al obtener los clientes. Intente nuevamente más tarde.');
        setClientes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClientes();
  }, [token]);

  // Filtrar clientes por búsqueda
  const clientesFiltrados = clientes.filter(cliente => {
    const id = cliente._id.toLowerCase();
    const email = cliente.email.toLowerCase();
    return id.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  const totalClientes = clientesFiltrados.length;
  const activos = clientesFiltrados.filter(cliente => cliente.status).length;
  const inactivos = totalClientes - activos;
  const pedidosTotales = clientesFiltrados.reduce((total, cliente) => total + (cliente.orders?.length || 0), 0);
  const clienteMasPedidos = totalClientes > 0
    ? clientesFiltrados.reduce((max, cliente) =>
        (cliente.orders?.length > (max.orders?.length || 0) ? cliente : max), clientesFiltrados[0])
    : null;
    const ultimoPedido = clientesFiltrados.flatMap(cliente => cliente.orders || []).sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date || 'Ninguno';

  if (loading) return <div className="spinner-container"><ClipLoader size={50} color="#FFA500" /></div>;
  if (error) return <div className="error-message"><p>{error}</p></div>;

  return (
    <div className="container">
      <h2>Gestión de Clientes</h2>
      <p>
        La <strong>Gestión de Clientes</strong> es fundamental para cualquier plataforma empresarial moderna. Este módulo permite gestionar eficientemente la información de los clientes, facilitando decisiones estratégicas y mejorando la experiencia del cliente.
      </p>
      <div className="search-container">
      <div className="search-box">
          <input type="text" placeholder="Buscar por ID... / Buscar por e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
      </div>
      </div>
      <h2>📊 Resumen de Clientes</h2>
      <div className="stats-container">
        <p><b>👥TOTAL DE CLIENTES:</b> {totalClientes}</p>
        <p><b>🟢CLIENTES ACTIVOS:</b> {activos}</p>
        <p><b>🔴CLIENTES INACTIVOS:</b> {inactivos}</p>
        <p><b>📦PEDIDOS TOTALES:</b> {pedidosTotales}</p>
        <p><b>🕒ÚLTIMO PEDIDO:</b> {ultimoPedido}</p>
        {clienteMasPedidos && (
          <p><b>🏆 CLIENTE CON MÁS PEDIDOS:</b> ID: {clienteMasPedidos._id} ({clienteMasPedidos.orders?.length || 0} Pedidos)</p>
        )}
      </div>
      <h2>Listado de Clientes</h2>
      <ul className="clientes-list">
        {clientesFiltrados.map(cliente => (
          <ClienteItem key={cliente._id} cliente={cliente} />
        ))}
      </ul>
    </div>
  );
};

export default ListadoClientes;
