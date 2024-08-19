// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ isAuthenticated, onLogout }) => {
  const [showGoodbyeMessage, setShowGoodbyeMessage] = React.useState(false);

  const logout = () => {
    setShowGoodbyeMessage(true);
    setTimeout(() => {
      setShowGoodbyeMessage(false);
      onLogout();
    }, 3000);
  };

  return (
    <header>
      <h1>Home Appliances SRO</h1>
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
              <div className="logout">
                <button onClick={logout}>LogOut</button>
              </div>
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

export default Header;
