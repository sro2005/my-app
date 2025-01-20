// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const Header = ({ isAuthenticated, onLogout }) => {
  const [showGoodbyeMessage, setShowGoodbyeMessage] = React.useState(false);

  const logout = () => {
    setShowGoodbyeMessage(true);
    setTimeout(() => {
      setShowGoodbyeMessage(false);
      onLogout(); // Asegúrate de usar onLogout
    }, 3000);
  };

  return (
    <header>
      <h1>⚡ELECTROVIBEHOME⚡</h1>
      <div class="separator-shadow"></div>
      <h4>• TRANSFORMA TU HOGAR CON LA ENERGÍA DEL FUTURO •</h4>
      <nav aria-label="Main Navigation">
        <ul>
          {isAuthenticated ? (
            <div className="nav-container">
            <ul className="nav-links">
              <li><Link to="/home-page">Home</Link></li>
              <li><Link to="/producto-form">Add Products</Link></li>
              <li><Link to="/pedido-form">Place Orders</Link></li>
              <li><Link to="/listado-clientes">Módulo Clientes</Link></li>
              <li><Link to="/listado-productos">Módulo Inventarios</Link></li>
              <li><Link to="/listado-pedidos">Módulo Pedidos</Link></li>
              <li><Link to="/perfil-cliente">Perfil</Link></li>
            </ul>
             <div className="nav-actions">
                <button className="logout-button" onClick={logout}>
                  <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
             </div>
            </div>
          ) : (
            <>
              <li><Link to="/register">Registro</Link></li>
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
