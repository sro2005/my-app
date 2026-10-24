import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import ListadoClientes from './ListadoClientes';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
vi.mock('react-spinners/ClipLoader', () => ({ default: () => <div role="status">Cargando</div> }));

afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllEnvs(); localStorage.clear(); });

const client = {
  _id: '507f1f77bcf86cd799439011',
  role: 'user',
  firstName: 'Demo',
  lastName: 'Buyer',
  email: 'buyer@example.test',
  phone: '+57 300 123 4567',
  identificationNumber: '1.234.567',
  birthDate: '1990-01-01T12:00:00.000Z',
  lastActivityDate: new Date().toISOString(),
  orders: [{
    _id: '507f1f77bcf86cd799439099',
    orderDate: '2026-10-24T15:00:00.000Z',
    status: 'Procesando',
    paymentStatus: 'SIMULATED',
    totalAmount: 45000,
    products: [{ productId: { _id: '507f1f77bcf86cd799439088', name: 'Cafetera de muestra', category: 'Cafeteras' }, quantity: 2 }]
  }]
};

const renderClients = () => {
  vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
  localStorage.setItem('authToken', 'admin-demo-token');
  axios.get.mockResolvedValue({ data: [client] });
  return render(<ListadoClientes />);
};

describe('Admin customer history', () => {
  test('shows an expandable order history with fictional payment and product details', async () => {
    renderClients();
    const summary = await screen.findByText('Ver historial de compras (1)');
    fireEvent.click(summary);
    expect(await screen.findByText(/Simulado · sin cobro/)).toBeTruthy();
    expect(screen.getByText(/Importe ficticio:/)).toBeTruthy();
    expect(screen.getByText(/45.000/)).toBeTruthy();
    expect(screen.getByText(/Cafetera de muestra/)).toBeTruthy();
    expect(screen.getByText(/Estado: Procesando/)).toBeTruthy();
    expect(axios.get).toHaveBeenCalledWith('https://api.example.test/api/customers/all', {
      headers: { Authorization: 'Bearer admin-demo-token' }
    });
  });

  test('filters customers by name in addition to email and id', async () => {
    renderClients();
    await screen.findByText(/Demo Buyer/);
    fireEvent.change(screen.getByPlaceholderText(/nombre, correo, celular o ID/i), { target: { value: 'buyer@example.test' } });
    expect(screen.getByText(/Demo Buyer/)).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText(/nombre, correo, celular o ID/i), { target: { value: 'missing' } });
    expect(screen.queryByText(/Demo Buyer/)).toBeNull();
  });
});
