import React from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RoleGuard from './RoleGuard';

afterEach(cleanup);

const renderProtectedPage = (user, allowedRole, path = '/pedido-form') => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/pedido-form" element={
        <RoleGuard user={user} allowedRole={allowedRole}>
          <h1>Formulario de pedidos</h1>
        </RoleGuard>
      } />
      <Route path="/home-page" element={<h1>Panel principal</h1>} />
      <Route path="/login" element={<h1>Iniciar sesión</h1>} />
    </Routes>
  </MemoryRouter>
);

describe('RoleGuard', () => {
  test('redirects administrators away from the customer checkout even on a direct URL', () => {
    renderProtectedPage({ _id: 'admin-1', role: 'admin' }, 'user');

    expect(screen.getByRole('heading', { name: 'Panel principal' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Formulario de pedidos' })).toBeNull();
  });

  test('allows the matching role to access a protected page', () => {
    renderProtectedPage({ _id: 'customer-1', role: 'user' }, 'user');

    expect(screen.getByRole('heading', { name: 'Formulario de pedidos' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Panel principal' })).toBeNull();
  });

  test('sends an unauthenticated visitor to login', () => {
    renderProtectedPage(null, 'user');

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
  });
});
