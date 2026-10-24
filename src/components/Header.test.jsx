import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Header from './Header';
import { AuthContext } from '../contexts/AuthContext';

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span aria-hidden="true" />
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderHeader = user => {
  const handleLogout = vi.fn();
  render(
    <AuthContext.Provider value={{ user, handleLogout }}>
      <Header />
    </AuthContext.Provider>
  );
  return { handleLogout };
};

describe('Header navigation', () => {
  test('shows public catalog, registration and login links for guests', () => {
    renderHeader(null);

    expect(screen.getByRole('navigation', { name: /navegación principal/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /catálogo/i }).getAttribute('href')).toBe('/catalogo');
    expect(screen.getByRole('link', { name: /únete hoy/i }).getAttribute('href')).toBe('/register');
    expect(screen.getByRole('link', { name: /iniciar sesión/i }).getAttribute('href')).toBe('/login');
    expect(screen.queryByRole('link', { name: /inventario|clientes|agregar producto/i })).toBeNull();
  });

  test('shows customer actions but hides administrator-only navigation', () => {
    renderHeader({
      _id: 'customer-1',
      role: 'user'
    });

    expect(screen.getByRole('link', { name: /realizar pedido/i }).getAttribute('href')).toBe('/pedido-form');
    expect(screen.getByRole('link', { name: /preferencias/i }).getAttribute('href')).toBe('/listado-productos');
    expect(screen.getByRole('link', { name: /mis pedidos/i }).getAttribute('href')).toBe('/listado-pedidos');
    expect(screen.getByRole('link', { name: /mi perfil/i }).getAttribute('href')).toBe('/perfil-cliente');
    expect(screen.queryByRole('link', { name: /inventario|clientes|agregar producto/i })).toBeNull();
  });

  test('shows inventory and customer-management links only for administrators', () => {
    renderHeader({
      _id: 'admin-1',
      role: 'admin'
    });

    expect(screen.getByRole('link', { name: /gestionar productos/i }).getAttribute('href')).toBe('/admin-inventario');
    expect(screen.getByRole('link', { name: /^clientes$/i }).getAttribute('href')).toBe('/listado-clientes');
    expect(screen.getByRole('link', { name: /inventario/i }).getAttribute('href')).toBe('/listado-productos');
    expect(screen.getByRole('link', { name: /^pedidos$/i }).getAttribute('href')).toBe('/listado-pedidos');
    expect(screen.queryByRole('link', { name: /mi perfil|realizar pedido/i })).toBeNull();
  });

  test('closes the session immediately without a misaligned goodbye notice', () => {
    const { handleLogout } = renderHeader({ _id: 'customer-1', role: 'user' });

    fireEvent.click(screen.getByRole('button', { name: /salir/i }));
    expect(handleLogout).toHaveBeenCalledOnce();
    expect(screen.queryByText(/gracias por visitarnos/i)).toBeNull();
  });
});
