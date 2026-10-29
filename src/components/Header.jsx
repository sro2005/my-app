import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignOutAlt,
  faHome,
  faCheckSquare,
  faUser,
  faUsers,
  faBoxOpen,
  faClipboardList,
  faUserPlus,
  faDoorOpen,
  faLock,
  faBolt
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../contexts/AuthContext';
import './Header.css';

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
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    if (!logoutDialogOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setLogoutDialogOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [logoutDialogOpen]);

  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    handleLogout();
  };

  return (
    <header className="evh-site-header">
      <div className="evh-header-inner">
        <Link className="evh-site-brand" to={user ? '/home-page' : '/'} aria-label="ElectroVibeHome, ir al inicio">
          <span className="evh-site-brand-mark" aria-hidden="true"><FontAwesomeIcon icon={faBolt} /></span>
          <span className="evh-site-brand-copy">
            <strong>ELECTROVIBEHOME</strong>
            <small>TECNOLOGÍA PARA EL HOGAR</small>
          </span>
        </Link>

        <nav aria-label="Navegación principal">
          <ul className="evh-header-links">
            {!user ? (
              <>
                {navLink('/catalogo', faBoxOpen, 'Catálogo')}
                {navLink('/register', faUserPlus, 'Crear Cuenta')}
                {navLink('/login', faDoorOpen, 'Iniciar Sesión')}
              </>
            ) : user.role === 'admin' ? (
              <>
                {navLink('/home-page', faHome, 'Panel')}
                {navLink('/admin-inventario', faBoxOpen, 'Inventario')}
                {navLink('/listado-clientes', faUsers, 'Clientes')}
                {navLink('/listado-pedidos', faClipboardList, 'Pedidos')}
                {navLink('/seguridad', faLock, 'Seguridad')}
                <li>
                  <button className="evh-site-logout" type="button" onClick={() => setLogoutDialogOpen(true)} aria-label="Cerrar Sesión">
                    <FontAwesomeIcon icon={faSignOutAlt} aria-hidden="true" />
                    <span>Salir</span>
                  </button>
                </li>
              </>
            ) : (
              <>
                {navLink('/home-page', faHome, 'Inicio')}
                {navLink('/catalogo', faBoxOpen, 'Catálogo')}
                {navLink('/pedido-form', faCheckSquare, 'Realizar Pedido')}
                {navLink('/listado-pedidos', faClipboardList, 'Mis Pedidos')}
                {navLink('/perfil-cliente', faUser, 'Mi Perfil')}
                {navLink('/seguridad', faLock, 'Seguridad')}
                <li>
                  <button className="evh-site-logout" type="button" onClick={() => setLogoutDialogOpen(true)} aria-label="Cerrar Sesión">
                    <FontAwesomeIcon icon={faSignOutAlt} aria-hidden="true" />
                    <span>Salir</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
      {logoutDialogOpen && (
        <div
          className="evh-logout-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLogoutDialogOpen(false);
          }}
        >
          <section
            className="evh-logout-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="evh-logout-title"
            aria-describedby="evh-logout-description"
          >
            <span className="evh-logout-mark" aria-hidden="true">↗</span>
            <span className="evh-logout-eyebrow">ELECTROVIBEHOME</span>
            <h2 id="evh-logout-title">¿Quieres cerrar sesión?</h2>
            <p id="evh-logout-description">Puedes volver a entrar cuando quieras. ¿Deseas salir de tu cuenta ahora?</p>
            <div className="evh-logout-actions">
              <button type="button" className="evh-logout-cancel" autoFocus onClick={() => setLogoutDialogOpen(false)}>
                Seguir Aquí
              </button>
              <button type="button" className="evh-logout-confirm" onClick={confirmLogout}>
                Cerrar Sesión
              </button>
            </div>
          </section>
        </div>
      )}
    </header>
  );
};

export default Header;
