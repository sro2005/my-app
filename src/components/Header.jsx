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
  faLock
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
          <span className="evh-site-brand-mark" aria-hidden="true">⚡</span>
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
                {navLink('/register', faUserPlus, 'Crear cuenta')}
                {navLink('/login', faDoorOpen, 'Iniciar sesión')}
              </>
            ) : user.role === 'admin' ? (
              <>
                {navLink('/home-page', faHome, 'Panel')}
                {navLink('/admin-inventario', faBoxOpen, 'Inventario')}
                {navLink('/listado-clientes', faUsers, 'Clientes')}
                {navLink('/listado-pedidos', faClipboardList, 'Pedidos')}
                {navLink('/seguridad', faLock, 'Seguridad')}
                <li>
                  <button className="evh-site-logout" type="button" onClick={() => setLogoutDialogOpen(true)} aria-label="Cerrar sesión">
                    <FontAwesomeIcon icon={faSignOutAlt} aria-hidden="true" />
                    <span>Salir</span>
                  </button>
                </li>
              </>
            ) : (
              <>
                {navLink('/home-page', faHome, 'Inicio')}
                {navLink('/catalogo', faBoxOpen, 'Catálogo')}
                {navLink('/pedido-form', faCheckSquare, 'Realizar pedido')}
                {navLink('/listado-pedidos', faClipboardList, 'Mis pedidos')}
                {navLink('/perfil-cliente', faUser, 'Mi perfil')}
                {navLink('/seguridad', faLock, 'Seguridad')}
                <li>
                  <button className="evh-site-logout" type="button" onClick={() => setLogoutDialogOpen(true)} aria-label="Cerrar sesión">
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
                Seguir aquí
              </button>
              <button type="button" className="evh-logout-confirm" onClick={confirmLogout}>
                Cerrar sesión
              </button>
            </div>
          </section>
        </div>
      )}
    </header>
  );
};

export default Header;
