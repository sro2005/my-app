import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import PedidoForm from './PedidoForm';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn() }
}));

vi.mock('react-select', () => ({
  default: ({ inputId, options = [], onChange, value, placeholder, isDisabled }) => (
    <select
      id={inputId}
      aria-label={inputId}
      value={value?.value || ''}
      disabled={isDisabled}
      onChange={event => onChange(options.find(option => option.value === event.target.value) || null)}
    >
      <option value="">{placeholder}</option>
      {options.map(option => <option key={option.value} value={option.value}>{option.value}</option>)}
    </select>
  )
}));

vi.mock('./FormPage', () => ({
  default: ({ children }) => <div>{children}</div>
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  localStorage.clear();
});

const renderCheckout = () => {
  const user = {
    _id: 'customer-1',
    role: 'user',
    preferences: ['Lavadoras']
  };
  localStorage.setItem('authToken', 'test-token');
  localStorage.setItem('userData', JSON.stringify({
    firstName: 'Cliente',
    lastName: 'Demo',
    email: 'cliente@example.com',
    phone: '+57 300 123 4567'
  }));
  vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user }}>
        <PedidoForm />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('PedidoForm catalog loading', () => {
  test('falls back to the full catalog when preferred products have no available stock', async () => {
    axios.get
      .mockResolvedValueOnce({ data: [{ _id: 'p-out', name: 'Lavadora Agotada', category: 'Lavadoras', price: 100000, quantity: 0 }] })
      .mockResolvedValueOnce({ data: [{ _id: 'p-1', name: 'Monitor Demo', category: 'Computadores', price: 250000, quantity: 2, demo: true }] });

    renderCheckout();

    expect(await screen.findByRole('option', { name: 'p-1' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/catálogo completo/i);
    expect(axios.get).toHaveBeenNthCalledWith(
      1,
      'https://api.example.test/api/products/preferences',
      { headers: { Authorization: 'Bearer test-token' } }
    );
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      'https://api.example.test/api/products',
      { headers: { Authorization: 'Bearer test-token' } }
    );
  });

  test('falls back to the full catalog if the preferences endpoint fails', async () => {
    axios.get
      .mockRejectedValueOnce(new Error('preferences endpoint unavailable'))
      .mockResolvedValueOnce({ data: [{ _id: 'p-2', name: 'Televisor Demo', category: 'Televisores', price: 400000, quantity: 1 }] });

    renderCheckout();

    expect(await screen.findByRole('option', { name: 'p-2' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/no pudimos cargar las recomendaciones/i);
  });

  test('completes an in-app demo purchase without calling Wompi checkout', async () => {
    axios.get.mockResolvedValueOnce({
      data: [{
        _id: 'p-demo',
        name: 'Cafetera ficticia',
        category: 'Cafeteras',
        price: 45000,
        quantity: 3,
        demo: true
      }]
    });
    axios.post.mockResolvedValueOnce({
      data: { order: { _id: 'order-demo-123' } }
    });

    renderCheckout();

    await screen.findByRole('option', { name: 'p-demo' });
    fireEvent.change(screen.getByLabelText('checkout-product'), { target: { value: 'p-demo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al pedido' }));
    fireEvent.change(screen.getByLabelText('checkout-payment'), { target: { value: 'Demostración' } });
    fireEvent.change(screen.getByLabelText('Dirección de entrega'), { target: { value: 'Calle 10 # 20-30, Bogotá' } });
    fireEvent.change(screen.getByLabelText('Fecha deseada de entrega'), { target: { value: '2099-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar compra ficticia' }));
    fireEvent.click(await screen.findByRole('button', { name: 'CONFIRMAR COMPRA FICTICIA' }));

    await screen.findByText(/pedido de demostración creado/i);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post.mock.calls[0][0]).toBe('https://api.example.test/api/orders/realizar');
    expect(axios.post.mock.calls[0][1].products).toEqual([{ productId: 'p-demo', quantity: 1 }]);
    expect(screen.getByRole('link', { name: 'Ver mis pedidos' })).toBeTruthy();
  });
  test('builds one fictional order with multiple products and quantities', async () => {
    axios.get.mockResolvedValueOnce({ data: [
      { _id: 'p-1', name: 'Cafetera Demo', category: 'Cafeteras', price: 45000, quantity: 3, demo: true },
      { _id: 'p-2', name: 'Monitor Demo', category: 'Computadores', price: 100000, quantity: 2, demo: true }
    ] });
    axios.post.mockResolvedValueOnce({ data: { order: { _id: 'order-multi-123' } } });
    renderCheckout();

    await screen.findByRole('option', { name: 'p-1' });
    fireEvent.change(screen.getByLabelText('checkout-product'), { target: { value: 'p-1' } });
    fireEvent.change(screen.getByLabelText('Unidades'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al pedido' }));

    fireEvent.change(screen.getByLabelText('checkout-product'), { target: { value: 'p-2' } });
    fireEvent.change(screen.getByLabelText('Unidades'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al pedido' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Monitor Demo' }));

    expect(screen.getByText('Cafetera Demo')).toBeTruthy();
    expect(screen.getByText('Monitor Demo')).toBeTruthy();
    expect(screen.getByText(/290\.000/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('checkout-payment'), { target: { value: 'Demostración' } });
    fireEvent.change(screen.getByLabelText('Dirección de entrega'), { target: { value: 'Calle 10 # 20-30, Bogotá' } });
    fireEvent.change(screen.getByLabelText('Fecha deseada de entrega'), { target: { value: '2099-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar compra ficticia' }));
    fireEvent.click(await screen.findByRole('button', { name: 'CONFIRMAR COMPRA FICTICIA' }));

    await screen.findByText(/pedido de demostración creado/i);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post.mock.calls[0][1].products).toEqual([
      { productId: 'p-1', quantity: 2 },
      { productId: 'p-2', quantity: 2 }
    ]);
  });

  test('does not add a cart quantity greater than the selected product stock', async () => {
    axios.get.mockResolvedValueOnce({ data: [
      { _id: 'p-stock', name: 'Producto Limitado', category: 'Prueba', price: 12000, quantity: 2 }
    ] });
    renderCheckout();
    await screen.findByRole('option', { name: 'p-stock' });

    fireEvent.change(screen.getByLabelText('checkout-product'), { target: { value: 'p-stock' } });
    fireEvent.change(screen.getByLabelText('Unidades'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al pedido' }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Producto Limitado', { selector: 'strong' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Registrar compra ficticia' }).disabled).toBe(true);
  });

});
