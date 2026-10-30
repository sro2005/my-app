import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import ListadoClientes from './ListadoClientes';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));

afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllEnvs(); localStorage.clear(); });

const client = {
  _id: '507f1f77bcf86cd799439011',
  role: 'user',
  firstName: 'Demo',
  lastName: 'Buyer',
  gender: 'female',
  email: 'buyer@example.test',
  phone: '+57 300 123 4567',
  identificationNumber: '1.234.567',
  birthDate: '1990-01-01T12:00:00.000Z',
  lastActivityDate: new Date().toISOString(),
  orders: [{
    _id: '507f1f77bcf86cd799439099',
    orderDate: '2026-10-24T15:00:00.000Z',
    status: 'Procesando',
    paymentStatus: 'PENDING',
    totalAmount: 45000,
    products: [{ productId: { _id: '507f1f77bcf86cd799439088', name: 'Cafetera de muestra', category: 'Cafeteras' }, quantity: 2 }]
  }]
};

const renderClients = (customers = [client]) => {
  vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
  localStorage.setItem('authToken', 'admin-demo-token');
  axios.get.mockResolvedValue({ data: customers });
  return render(<ListadoClientes />);
};

describe('Admin customer history', () => {
  test('shows a branded skeleton instead of a rotating loader while fetching', () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    localStorage.setItem('authToken', 'admin-demo-token');
    axios.get.mockReturnValue(new Promise(() => {}));

    render(<ListadoClientes />);

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText(/Preparando el directorio de clientes/i)).toBeTruthy();
    expect(screen.queryByText('Cargando')).toBeNull();
  });

  test('shows an expandable order history with payment status and product details', async () => {
    renderClients();
    const summary = await screen.findByText('Ver Historial de Pedidos (1)');
    expect(screen.getByRole('img', { name: /icono de perfil: femenino/i })).toBeTruthy();
    expect(screen.getByText('Demo Buyer (1 pedido)')).toBeTruthy();
    fireEvent.click(summary);
    expect(await screen.findByText(/Pendiente de revisión/)).toBeTruthy();
    expect(screen.getByText(/Valor del pedido:/)).toBeTruthy();
    expect(screen.getByText(/45.000/)).toBeTruthy();
    expect(screen.getByText(/Cafetera de muestra/)).toBeTruthy();
    expect(screen.getByText(/Estado: Procesando/)).toBeTruthy();
    expect(axios.get).toHaveBeenCalledWith('https://api.example.test/api/customers/all', {
      headers: { Authorization: 'Bearer admin-demo-token' }
    });
  });

  test('uses title case for the customer summary and directory, including zero orders', async () => {
    const customers = [
      { ...client, _id: '507f1f77bcf86cd799439011', firstName: 'Ana', orders: [] },
      { ...client, _id: '507f1f77bcf86cd799439012', firstName: 'Bruno', orders: [] },
      { ...client, _id: '507f1f77bcf86cd799439013', firstName: 'Carla', orders: [] }
    ];
    renderClients(customers);

    expect(await screen.findByText('Resumen de Clientes')).toBeTruthy();
    expect(screen.getByText('Total de Clientes')).toBeTruthy();
    expect(screen.getByText('Clientes Activos')).toBeTruthy();
    expect(screen.getByText('Clientes Inactivos')).toBeTruthy();
    expect(screen.getByText('Pedidos Registrados')).toBeTruthy();
    expect(screen.getByText('Último Pedido')).toBeTruthy();
    expect(screen.getByText('Cliente con Más Pedidos')).toBeTruthy();
    expect(screen.getByText('Directorio de Clientes')).toBeTruthy();
    expect(screen.getByText('3 Resultados')).toBeTruthy();
    expect(screen.getAllByText(/Historial de Pedidos: 0 Pedidos/)).toHaveLength(3);
  });

  test('filters customers by name and searches identification without punctuation', async () => {
    renderClients();
    await screen.findByText('buyer@example.test');
    const search = screen.getByPlaceholderText(/nombre, correo, teléfono o identificación/i);
    fireEvent.change(search, { target: { value: 'Demo' } });
    expect(screen.getAllByText(/Demo Buyer/)).toHaveLength(2);
    fireEvent.change(search, { target: { value: '1234567' } });
    expect(screen.getByText('buyer@example.test')).toBeTruthy();
    fireEvent.change(search, { target: { value: 'missing' } });
    expect(screen.queryByText('buyer@example.test')).toBeNull();
    expect(screen.getByText('Total de Clientes').parentElement.querySelector('p').textContent).toBe('1');
  });
});
