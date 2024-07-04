import React from 'react';
import { Link } from 'react-router-dom';

// Componente funcional Header que muestra el encabezado de la página
const Header = () => {
  return (
    <header>
      {/* Título principal del encabezado */}
      <h1>Home Appliances SRO</h1>
      {/* Navegación a las diferentes secciones */}
      <nav>
        <ul>
          <li><Link to="/home-page">Home</Link></li>
          <li><Link to="/producto-form">Agregar Producto</Link></li>
          <li><Link to="/pedido-form">Realizar Pedido</Link></li>
          <li><Link to="/confirmacion-pedido">Confirmación de Pedido</Link></li>
          <li><Link to="/listado-clientes">Listado de Clientes</Link></li>
          <li><Link to="/listado-productos">Listado de Productos</Link></li>
          <li><Link to="/listado-pedidos">Listado de Pedidos</Link></li>
          <li><Link to="/perfil-cliente">Perfil de Cliente</Link></li>
        </ul>
      </nav>
    </header>
  );
};

// Exportar el componente Header para que pueda ser utilizado en otros archivos
export default Header;
