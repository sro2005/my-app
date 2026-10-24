import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignOutAlt,
  faHome,
  faPlusCircle,
  faCheckSquare,
  faUser,
  faUsers,
  faBoxOpen,
  faClipboardList,
  faUserPlus,
  faDoorOpen
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../contexts/AuthContext';

const navLink = (to, icon, label) => (
  <li key={to}>
    <Link to={to}>
      <FontAwesomeIcon icon={icon} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  </li>
);

const Header = () => {
  const { user, handleLogout } = useContext(AuthContext);
  const [showGoodbyeMessage, setShowGoodbyeMessage] = React.useState(false);

  const logout = () => {
    setShowGoodbyeMessage(true);
    setTimeout(() => {
      setShowGoodbyeMessage(false);
      handleLogout();
    }, 1800);
  };

  return (
    <header className="evh-site-header">
      <div className="evh-header-inner">
        <Link className="evh-site-brand" to={user ? '/home-page' : '/'} aria-label="ElectroVibeHome, ir al inicio">
          <span className="evh-site-brand-mark" aria-hidden="true">⚡</span>
          <span className="evh-site-brand-copy">
            <strong>ELECTROVIBEHOME</strong>
            <small>• TRANSFORMA TU HOGAR CON LA ENERGÍA DEL FUTURO •</small>
          </span>
        </Link>

        <nav aria-label="Navegación principal">
          <ul className="evh-header-links">
            {!user ? (
              <>
                {navLink('/catalogo', faBoxOpen, 'Catálogo')}
                {navLink('/register', faUserPlus, 'Únete hoy')}
                {navLink('/login', faDoorOpen, 'Iniciar sesión')}
              </>
            ) : (
              <>
                {navLink('/home-page', faHome, 'Inicio')}
                {user.role === 'admin' && navLink('/admin-inventario', faPlusCircle, 'Gestionar productos')}
                {user.role === 'user' && navLink('/pedido-form', faCheckSquare, 'Realizar pedido')}
                {user.role === 'admin' && navLink('/listado-clientes', faUsers, 'Clientes')}
                {navLink('/listado-productos', faBoxOpen, user.role === 'admin' ? 'Inventario' : 'Preferencias')}
                {navLink('/listado-pedidos', faClipboardList, user.role === 'admin' ? 'Pedidos' : 'Mis órdenes')}
                {user.role === 'user' && navLink('/perfil-cliente', faUser, 'Mi perfil')}
                <li>
                  <button className="evh-site-logout" type="button" onClick={logout}>
                    <FontAwesomeIcon icon={faSignOutAlt} aria-hidden="true" />
                    <span>Salir</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
      {showGoodbyeMessage && (
        <div className="goodbye-message" role="status">
          <p>¡Gracias por visitarnos! Te esperamos de vuelta pronto.</p>
        </div>
      )}
    </header>
  );
};

export default Header;
