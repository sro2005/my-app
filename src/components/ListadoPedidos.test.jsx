import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import ListadoPedidos from './ListadoPedidos';

vi.mock('axios', () => ({
  default: { get: vi.fn(), put: vi.fn() }
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  localStorage.clear();
});

const order = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  firstName: 'Cliente',
  lastName: 'Demo',
  address: 'Calle 10, Bogotá',
  phone: '+57 300 123 4567',
  paymentMethod: 'Wompi',
  paymentStatus: 'APPROVED',
  paymentConfirmed: true,
  orderDate: '2026-10-20T15:00:00.000Z',
  deliveryDate: '2026-10-30T05:00:00.000Z',
  totalAmount: 150000,
  status: 'Procesando',
  packed: false,
  delivered: false,
  products: [{ productId: { name: 'Licuadora Demo', category: 'Licuadoras' }, quantity: 1 }],
  ...overrides
});

const renderOrders = (user = { _id: 'customer-1', role: 'admin' }) => render(
  <MemoryRouter>
    <AuthContext.Provider value={{ user }}>
      <ListadoPedidos />
    </AuthContext.Provider>
  </MemoryRouter>
);

const setApiEnvironment = () => {
  vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
  localStorage.setItem('authToken', 'test-token');
};

describe('ListadoPedidos', () => {
  test('keeps the heading visible and uses a branded skeleton instead of a spinner', () => {
    setApiEnvironment();
    axios.get.mockReturnValue(new Promise(() => {}));

    renderOrders();

    expect(screen.getByText(/Gestión de pedidos/i)).toBeTruthy();
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText(/Preparando el centro de pedidos/i)).toBeTruthy();
    expect(screen.queryByText(/Cargando pedidos/i)).toBeNull();
  });

  test('lets an admin mark a paid order as prepared and shipped', async () => {
    setApiEnvironment();
    axios.get.mockResolvedValue({ data: [order()] });
    axios.put.mockResolvedValue({
      data: {
        message: 'Estado del pedido actualizado.',
        order: {
          ...order(),
          status: 'Enviado',
          packed: true
        }
      }
    });

    renderOrders();

    const prepareButton = await screen.findByRole('button', { name: /marcar preparado y enviado/i });
    fireEvent.click(prepareButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'https://api.example.test/api/orders/507f1f77bcf86cd799439011/status',
        { packed: true },
        { headers: { Authorization: 'Bearer test-token' } }
      );
    });

    expect(await screen.findByRole('button', { name: /marcar como entregado/i })).toBeTruthy();
    expect(screen.getByText(/Estado del pedido actualizado/i)).toBeTruthy();
    expect(screen.getByText('Enviado').className).toContain('is-shipped');
  });

  test('does not expose admin logistics actions to a customer', async () => {
    setApiEnvironment();
    axios.get.mockResolvedValue({ data: [order()] });

    renderOrders({ _id: 'customer-1', role: 'user' });

    expect(await screen.findByText(/Cliente Demo/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /marcar preparado y enviado/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /marcar como entregado/i })).toBeNull();
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.example.test/api/orders/my-orders',
      { headers: { Authorization: 'Bearer test-token' } }
    );
  });

  test('renders a legacy order without a products array instead of crashing', async () => {
    setApiEnvironment();
    axios.get.mockResolvedValue({ data: [order({ products: undefined })] });

    renderOrders();

    expect(await screen.findByText(/No hay productos en este pedido/i)).toBeTruthy();
    expect(screen.getByText(/Cliente Demo/)).toBeTruthy();
  });

  test('shows the empty state when the API returns no orders', async () => {
    setApiEnvironment();
    axios.get.mockResolvedValue({ data: [] });

    renderOrders({ _id: 'customer-1', role: 'user' });

    expect(await screen.findByText(/Aún no tienes pedidos/i)).toBeTruthy();
  });
});
