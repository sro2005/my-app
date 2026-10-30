import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axios from 'axios';
import AdminDashboard, { summarizeAdminOperations } from './AdminDashboard';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
vi.mock('react-router-dom', () => ({ Link: ({ to, children }) => <a href={to}>{children}</a> }));

afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks(); vi.unstubAllEnvs(); });

describe('Admin dashboard', () => {
  test('summarizes pending payments without counting them as received income', () => {
    const result = summarizeAdminOperations([
      { paymentStatus: 'PENDING', totalAmount: 120000, status: 'Pendiente' },
      { paymentStatus: 'APPROVED', totalAmount: 900000, status: 'Procesando' }
    ], [{ role: 'user' }, { role: 'admin' }], [{ quantity: 1 }, { quantity: 12 }]);
    expect(result.pendingPayment).toBe(1);
    expect(result.pendingValue).toBe(120000);
    expect(result.customers).toBe(1);
    expect(result.lowStock).toBe(1);
  });

  test('loads operational information through admin-protected API endpoints', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    localStorage.setItem('authToken', 'test-admin-token');
    axios.get.mockResolvedValueOnce({ data: [
      {
        _id: 'order-1', firstName: 'Cliente', lastName: 'Demo', email: 'demo@example.test',
        paymentStatus: 'PENDING', totalAmount: 50000, status: 'Pendiente'
      },
      {
        _id: 'order-2', firstName: 'Cliente', lastName: 'Demo', email: 'demo2@example.test',
        paymentMethod: 'Pago pendiente de coordinación', paymentStatus: 'APPROVED', totalAmount: 90000, status: 'Entregado'
      }
    ] }).mockResolvedValueOnce({ data: [{ role: 'user' }] })
      .mockResolvedValueOnce({ data: [{ quantity: 2 }] });
    render(<AdminDashboard />);
    expect(await screen.findAllByText('Cliente Demo')).toHaveLength(2);
    expect(screen.getByText(/pedidos sin pago confirmado no representan ingresos recibidos/i)).toBeTruthy();
    expect(screen.getByText('Pendiente de revisión')).toBeTruthy();
    expect(screen.getByText('Pago confirmado')).toBeTruthy();
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
