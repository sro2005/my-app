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

const renderCheckout = (initialEntry = '/pedido-form') => {
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
    <MemoryRouter initialEntries={[initialEntry]}>
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

  test('registers an order for manual payment review without an external payment provider', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al Pedido' }));
    expect(screen.getByText('ElectroVibe Pay')).toBeTruthy();
    expect(screen.queryByRole('radio', { name: /Tarjeta/i })).toBeNull();
    fireEvent.change(screen.getByLabelText('Dirección de entrega'), { target: { value: 'Calle 10 # 20-30, Bogotá' } });
    fireEvent.change(screen.getByLabelText('Fecha deseada de entrega'), { target: { value: '2099-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con ElectroVibe Pay' }));
    const confirmation = await screen.findByRole('dialog', { name: /confirma tu pedido/i });
    expect(screen.getByText('Confirmación del pedido')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Datos de entrega' })).toBeTruthy();
    expect(confirmation.textContent).toContain('Cafetera ficticia');
    expect(confirmation.textContent).toMatch(/estado del pago se actualizará después de la revisión correspondiente/i);
    expect(confirmation.textContent).toMatch(/ElectroVibe Pay · confirmación pendiente/i);
    fireEvent.click(screen.getByRole('button', { name: /confirmar pedido/i }));

    await screen.findByText(/pedido registrado/i);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post.mock.calls[0][0]).toBe('https://api.example.test/api/orders/realizar');
    expect(axios.post.mock.calls[0][1].products).toEqual([{ productId: 'p-demo', quantity: 1 }]);
    expect(axios.post.mock.calls[0][1].paymentMethod).toBe('Pago pendiente de coordinación');
    expect(axios.post.mock.calls[0][1].paymentPreference).toBeUndefined();
    expect(screen.getByRole('link', { name: 'Ver Mis Pedidos' })).toBeTruthy();
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
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al Pedido' }));

    fireEvent.change(screen.getByLabelText('checkout-product'), { target: { value: 'p-2' } });
    fireEvent.change(screen.getByLabelText('Unidades'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al Pedido' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Monitor Demo' }));

    expect(screen.getByText('Cafetera Demo')).toBeTruthy();
    expect(screen.getByText('Monitor Demo')).toBeTruthy();
    expect(screen.getByText(/290\.000/)).toBeTruthy();

    expect(screen.getByText('ElectroVibe Pay')).toBeTruthy();
    expect(screen.queryByRole('radio', { name: /Tarjeta/i })).toBeNull();
    fireEvent.change(screen.getByLabelText('Dirección de entrega'), { target: { value: 'Calle 10 # 20-30, Bogotá' } });
    fireEvent.change(screen.getByLabelText('Fecha deseada de entrega'), { target: { value: '2099-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con ElectroVibe Pay' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar pedido' }));

    await screen.findByText(/pedido registrado/i);
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
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al Pedido' }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Producto Limitado', { selector: 'strong' })).toBeNull();
    expect(screen.getByText('ElectroVibe Pay')).toBeTruthy();
    expect(screen.queryByRole('radio', { name: /Tarjeta/i })).toBeNull();
    expect(screen.getByRole('button', { name: 'Añade productos para continuar' }).disabled).toBe(true);
  });

  test('preselects a requested live catalogue product using the full catalogue endpoint', async () => {
    axios.get.mockResolvedValueOnce({ data: [
      { _id: 'p-live', name: 'Cafetera elegida', category: 'Cafeteras', price: 45000, quantity: 3, demo: true },
      { _id: 'p-other', name: 'Televisor de muestra', category: 'Televisores', price: 300000, quantity: 1, demo: true }
    ] });

    renderCheckout('/pedido-form?productId=p-live');

    await screen.findByRole('option', { name: 'p-live' });
    expect(screen.getByLabelText('checkout-product').value).toBe('p-live');
    expect(screen.getByLabelText('Unidades').value).toBe('1');
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith('https://api.example.test/api/products', {
      headers: { Authorization: 'Bearer test-token' }
    });
    expect(axios.get).not.toHaveBeenCalledWith('https://api.example.test/api/products/preferences', expect.anything());
  });

  test('shows a clear notice when a catalogue product in the link is unavailable', async () => {
    axios.get.mockResolvedValueOnce({ data: [
      { _id: 'p-other', name: 'Televisor de muestra', category: 'Televisores', price: 300000, quantity: 1, demo: true }
    ] });

    renderCheckout('/pedido-form?productId=p-now-unavailable');

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/ya no tiene existencias|dejó de estar disponible/i);
    expect(screen.getByLabelText('checkout-product').value).toBe('');
  });


  
});
