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
    expect(screen.getByText('Enviado', { selector: '.evh-order-status' }).className).toContain('is-shipped');
  });

  test('shows the same coordinated payment method and pending status to both roles', async () => {
    setApiEnvironment();
    const coordinated = order({ paymentMethod: 'Pago pendiente de coordinación', paymentPreference: 'PSE', paymentStatus: 'PENDING', paymentConfirmed: false, status: 'Pendiente' });
    axios.get.mockResolvedValue({ data: [coordinated] });
    const admin = renderOrders();
    expect(await screen.findByRole('button', { name: /iniciar preparación/i })).toBeTruthy();
    expect(screen.getByText('Pago pendiente de coordinación')).toBeTruthy();
    expect(screen.getByText('PSE')).toBeTruthy();
    admin.unmount();
    renderOrders({ _id: 'customer-1', role: 'user' });
    expect(await screen.findByText('Pago pendiente de coordinación')).toBeTruthy();
    expect(screen.getByText('PSE')).toBeTruthy();
    expect(screen.getByText(/pendiente de pago · sin cobro realizado/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /iniciar preparación/i })).toBeNull();
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


describe('Admin order management filters and layout', () => {
  test('searches orders by customer, email, product, and identifier', async () => {
    setApiEnvironment();
    axios.get.mockResolvedValue({ data: [order(), order({
      _id: '507f1f77bcf86cd799439022',
      firstName: 'María',
      lastName: 'Pérez',
      email: 'maria@example.test',
      status: 'Enviado',
      packed: true,
      products: [{ productId: { name: 'Televisor Demo', category: 'Televisores' }, quantity: 2 }]
    })] });

    renderOrders();

    expect(await screen.findByText(/Cliente Demo/)).toBeTruthy();
    const search = screen.getByRole('searchbox', { name: /identificador, cliente, contacto o producto/i });
    fireEvent.change(search, { target: { value: 'maria example test' } });
    expect(screen.getByText(/María Pérez/)).toBeTruthy();
    expect(screen.queryByText(/Cliente Demo/)).toBeNull();

    fireEvent.change(search, { target: { value: 'televisor' } });
    expect(screen.getByText(/Televisor Demo/)).toBeTruthy();
    expect(screen.queryByText(/María Pérez/)).toBeTruthy();
  });

  test('filters by order status and restores the full directory', async () => {
    setApiEnvironment();
    axios.get.mockResolvedValue({ data: [
      order(),
      order({ _id: '507f1f77bcf86cd799439022', status: 'Enviado', packed: true })
    ] });

    renderOrders();

    const filter = await screen.findByRole('combobox', { name: /estado del pedido/i });
    fireEvent.change(filter, { target: { value: 'Enviado' } });
    expect(screen.getByText('Enviado', { selector: '.evh-order-status' })).toBeTruthy();
    expect(screen.queryByText('Procesando', { selector: '.evh-order-status' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    expect(screen.getByText('Procesando', { selector: '.evh-order-status' })).toBeTruthy();
    expect(screen.getAllByText('Enviado', { selector: '.evh-order-status' }).length).toBe(1);
  });

  test('keeps an order-specific status confirmation inside its card', async () => {
    setApiEnvironment();
    axios.get.mockResolvedValue({ data: [order()] });
    axios.put.mockResolvedValue({
      data: { message: 'Estado del pedido actualizado.', order: { ...order(), status: 'Enviado', packed: true } }
    });

    renderOrders();

    fireEvent.click(await screen.findByRole('button', { name: /marcar preparado y enviado/i }));
    const feedback = await screen.findByRole('status');
    expect(feedback.textContent).toContain('Estado del pedido actualizado.');
    expect(feedback.closest('.pedido-item')).toBeTruthy();
  });

  test('shows admin order information in simple aligned rows without extra product cards', async () => {
    setApiEnvironment();
    axios.get.mockResolvedValue({ data: [order()] });

    renderOrders();

    const details = (await screen.findByText('Cliente Demo')).closest('.evh-order-admin-details');
    expect(details).toBeTruthy();
    expect(details.querySelectorAll(':scope > p')).toHaveLength(8);
    expect(details.querySelector('.evh-order-admin-products')).toBeTruthy();
    expect(details.querySelector('.evh-order-products-section')).toBeNull();
    expect(details.querySelector('p:nth-child(2) strong').textContent).toBe('Cliente:');
    expect(details.querySelector('p:nth-child(3) strong').textContent).toBe('Dirección de entrega:');
    expect(details.querySelector('p:nth-child(8) strong').textContent).toBe('Productos:');
    expect(screen.queryByText('Correo electrónico:')).toBeNull();
  });

});
