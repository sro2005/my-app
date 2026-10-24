import React from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PaymentResult from './PaymentResult';

afterEach(cleanup);

describe('PaymentResult', () => {
  test('shows that a redirect is not proof of payment confirmation', () => {
    render(
      <MemoryRouter initialEntries={['/pago-resultado?reference=EVH-test-123&status=APPROVED']}>
        <PaymentResult />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /resultado de la simulación de pago/i })).toBeTruthy();
    expect(screen.getByText(/la redirección por sí sola no confirma el resultado/i)).toBeTruthy();
    expect(screen.getByText(/EVH-test-123/)).toBeTruthy();
    expect(screen.getByText(/APPROVED/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /consultar mis pedidos/i }).getAttribute('href')).toBe('/listado-pedidos');
  });

  test('does not display empty reference or status labels', () => {
    render(
      <MemoryRouter initialEntries={['/pago-resultado']}>
        <PaymentResult />
      </MemoryRouter>
    );

    expect(screen.queryByText(/referencia de prueba:/i)).toBeNull();
    expect(screen.queryByText(/estado informado por wompi/i)).toBeNull();
  });
});
