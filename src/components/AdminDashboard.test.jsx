import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axios from 'axios';
import AdminDashboard, { summarizeDemoOperations } from './AdminDashboard';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
vi.mock('react-router-dom', () => ({ Link: ({ to, children }) => <a href={to}>{children}</a> }));

afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks(); vi.unstubAllEnvs(); });

describe('Admin dashboard', () => {
  test('aggregates only fictitious internal totals, separate from Wompi', () => {
    const result = summarizeDemoOperations([
      { paymentStatus: 'SIMULATED', totalAmount: 120000, status: 'Procesando' },
      { paymentStatus: 'APPROVED', paymentMethod: 'Wompi', totalAmount: 900000, status: 'Entregado' }
    ], [{ role: 'user' }, { role: 'admin' }], [{ quantity: 1 }, { quantity: 12 }]);
    expect(result.simulatedValue).toBe(120000);
    expect(result.sandbox).toBe(1);
    expect(result.customers).toBe(1);
    expect(result.lowStock).toBe(1);
  });

  test('loads operational information through admin-protected API endpoints', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    localStorage.setItem('authToken', 'test-admin-token');
    axios.get.mockResolvedValueOnce({ data: [
      {
        _id: 'order-1', firstName: 'Cliente', lastName: 'Demo', email: 'demo@example.test',
        paymentStatus: 'SIMULATED', totalAmount: 50000, status: 'Procesando'
      },
      {
        _id: 'order-2', firstName: 'Cliente', lastName: 'Sandbox', email: 'sandbox@example.test',
        paymentMethod: 'Wompi', paymentStatus: 'APPROVED', totalAmount: 90000, status: 'Entregado'
      }
    ] }).mockResolvedValueOnce({ data: [{ role: 'user' }] })
      .mockResolvedValueOnce({ data: [{ quantity: 2 }] });
    render(<AdminDashboard />);
    expect(await screen.findByText('Cliente Demo')).toBeTruthy();
    expect(screen.getByText(/checkout de Wompi Sandbox requiere credenciales de prueba válidas/i)).toBeTruthy();
    expect(screen.getByText('Sin pago')).toBeTruthy();
    expect(screen.getByText('Aprobado (Sandbox)')).toBeTruthy();
    expect(screen.queryByText('APPROVED')).toBeNull();
    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(axios.get).toHaveBeenCalledWith('https://api.example.test/api/orders/all', {
      headers: { Authorization: 'Bearer test-admin-token' }
    });
  });

  test('does not show fabricated totals when the server rejects the session', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    localStorage.setItem('authToken', 'invalid-token');
    axios.get.mockRejectedValue({ response: { status: 403 } });
    render(<AdminDashboard />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Últimos pedidos')).toBeNull();
  });
});
