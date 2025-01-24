import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faHome, faPlusCircle, faCheckSquare, faUser, faUsers, faBoxOpen, faClipboardList } from '@fortawesome/free-solid-svg-icons';

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
      <div className="separator-shadow"></div>
      <h4>• TRANSFORMA TU HOGAR CON LA ENERGÍA DEL FUTURO •</h4>
      <nav aria-label="Main Navigation">
        <ul>
          {isAuthenticated ? (
            <div className="nav-container">
              <ul className="nav-links">
                <li>
                  <Link to="/home-page">
                    <div className="nav-icon"><FontAwesomeIcon icon={faHome} /></div>
                    <div className="nav-text">INICIO</div>
                  </Link>
                </li>
                <li>
                  <Link to="/producto-form">
                    <div className="nav-icon"><FontAwesomeIcon icon={faPlusCircle} /></div>
                    <div className="nav-text">AGREGAR PRODUCTOS</div>
                  </Link>
                </li>
                <li>
                  <Link to="/pedido-form">
                    <div className="nav-icon"><FontAwesomeIcon icon={faCheckSquare} /></div>
                    <div className="nav-text">REALIZAR PEDIDOS</div>
                  </Link>
                </li>
                <li>
                  <Link to="/listado-clientes">
                    <div className="nav-icon"><FontAwesomeIcon icon={faUsers} /></div>
                    <div className="nav-text">GESTIÓN DE CLIENTES</div>
                  </Link>
                </li>
                <li>
                  <Link to="/listado-productos">
                    <div className="nav-icon"><FontAwesomeIcon icon={faBoxOpen} /></div>
                    <div className="nav-text">GESTIÓN DE INVENTARIOS</div>
                  </Link>
                </li>
                <li>
                  <Link to="/listado-pedidos">
                    <div className="nav-icon"><FontAwesomeIcon icon={faClipboardList} /></div>
                    <div className="nav-text">GESTIÓN DE PEDIDOS</div>
                  </Link>
                </li>
                <li>
                  <Link to="/perfil-cliente">
                    <div className="nav-icon"><FontAwesomeIcon icon={faUser} /></div>
                    <div className="nav-text">PERFIL</div>
                  </Link>
                </li>
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
              <li><Link to="/login">Iniciar Sesión</Link></li>
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
