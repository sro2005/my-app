import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import HomePage from './HomePage';

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));

afterEach(cleanup);

const renderHome = user => render(
  <AuthContext.Provider value={{ user }}>
    <HomePage />
  </AuthContext.Provider>
);

describe('Customer home', () => {
  test('greets the customer and links to discovery, demo order, history and profile', () => {
    renderHome({ _id: 'u1', firstName: 'Camila Restrepo', role: 'user', preferences: ['Cafeteras'] });
    expect(screen.getByRole('heading', { name: /hola, Camila/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /descubrir productos/i }).getAttribute('href')).toBe('/catalogo');
    expect(screen.getByRole('link', { name: /pedir una recomendación/i }).getAttribute('href')).toBe('/catalogo');
    expect(screen.getByRole('link', { name: /preparar pedido de prueba/i }).getAttribute('href')).toBe('/pedido-form');
    expect(screen.getByRole('link', { name: /ver mis pedidos/i }).getAttribute('href')).toBe('/listado-pedidos');
    expect(screen.getByRole('link', { name: /revisar mi perfil/i }).getAttribute('href')).toBe('/perfil-cliente');
    expect(screen.getByText('Cafeteras')).toBeTruthy();
  });

  test('offers a friendly fallback when the customer has no first name or saved preferences', () => {
    renderHome({ _id: 'u2', role: 'user', preferences: [] });
    expect(screen.getByRole('heading', { name: /qué hacemos más fácil en tu hogar hoy/i })).toBeTruthy();
    expect(screen.getByText(/guarda tus intereses en el perfil/i)).toBeTruthy();
  });

  test('clearly states that prices, inventory and orders are demonstrative', () => {
    renderHome({ _id: 'u3', firstName: 'Demo', role: 'user', preferences: [] });
    expect(screen.getByText(/los precios y existencias son ilustrativos/i)).toBeTruthy();
    expect(screen.getByText(/no generan cobros ni transferencias reales/i)).toBeTruthy();
  });
});
