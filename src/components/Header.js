import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Componente funcional Header que muestra el encabezado de la página
const Header = ({ isAuthenticated, onLogout }) => {
  const [showGoodbyeMessage, setShowGoodbyeMessage] = useState(false);
    const handleLogout = () => {
      setShowGoodbyeMessage(true);
      setTimeout(() => {
      setShowGoodbyeMessage(false);
      onLogout();
    }, 3000); // Muestra el mensaje durante 3 segundos
  };

  return (
    <header>
      {/* Título principal del encabezado */}
      <h1>Home Appliances SRO</h1>
      {/* Navegación a las diferentes secciones */}
      <nav>
        <ul>
        {isAuthenticated ? (
            <>
              <li><Link to="/home-page">Home</Link></li>
              <li><Link to="/producto-form">Add Products</Link></li>
              <li><Link to="/pedido-form">Place Orders</Link></li>
              <li><Link to="/listado-clientes">Módulo Clientes</Link></li>
              <li><Link to="/listado-productos">Módulo Inventarios</Link></li>
              <li><Link to="/listado-pedidos">Módulo Pedidos</Link></li>
              <li><Link to="/perfil-cliente">Perfil</Link></li>
              <div className="logout"><button onClick={handleLogout}>LogOut</button></div>
            </>
          ) : (
            <>
              <li><Link to="/registro">Registro</Link></li>
              <li><Link to="/login">Login</Link></li>
            </>
          )}
        </ul>
      </nav>
        {showGoodbyeMessage && (
            <div className="goodbye-message">
              <h1>Gracias por visitarnos, vuelve pronto</h1>
            </div>
        )}      
    </header>
  );
};

// Exportar el componente Header para que pueda ser utilizado en otros archivos
export default Header;
