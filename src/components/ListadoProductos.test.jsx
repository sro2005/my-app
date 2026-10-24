import React from 'react';

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import ListadoProductos from './ListadoProductos';
import demoProducts from '../../data/demo-products.json';

vi.mock('axios', () => ({
  default: { get: vi.fn() }
}));

vi.mock('./ShoppingAssistant', () => ({
  default: () => null
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  localStorage.clear();
});

const renderCatalog = (user = null) => render(
  <AuthContext.Provider value={{ user }}>
    <ListadoProductos />
  </AuthContext.Provider>
);

describe('ListadoProductos', () => {
  test('keeps the loading view minimal and removes the generic catalogue phrase', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    let finishRequest;
    axios.get.mockReturnValue(new Promise(resolve => { finishRequest = resolve; }));

    renderCatalog();

    expect(screen.queryByText(/estamos preparando tu catálogo/i)).toBeNull();
    expect(screen.getByText('Cargando catálogo').className).toContain('evh-sr-only');

    finishRequest({ data: [] });
    expect(await screen.findByRole('heading', { name: /encuentra tu próximo favorito/i })).toBeTruthy();
  });

  test('shows the local demo catalog when the API URL is not configured', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', '');

    renderCatalog();

    expect(await screen.findByText('Catálogo de demostración')).toBeTruthy();
    expect(screen.getByRole('heading', { name: demoProducts[0].name })).toBeTruthy();
    expect(screen.getByRole('heading', { name: demoProducts[1].name })).toBeTruthy();
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('falls back to demo products when the API request fails and offers retry', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockRejectedValue(new Error('offline'));

    renderCatalog();

    expect(await screen.findByText('Catálogo de demostración')).toBeTruthy();
    expect(screen.getByRole('button', { name: /reintentar conexión/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: demoProducts[0].name })).toBeTruthy();
  });

  test('loads the full API catalog and lets visitors search it', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockResolvedValue({
      data: [
        { _id: 'p1', name: 'Licuadora Test', description: 'Para batidos', price: 150000, category: 'Licuadoras', quantity: 3 },
        { _id: 'p2', name: 'Tostadora Test', description: 'Para desayunos', price: 90000, category: 'Tostadoras', quantity: 4 }
      ]
    });

    renderCatalog();

    expect(await screen.findByRole('heading', { name: 'Licuadora Test' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Tostadora Test' })).toBeTruthy();
    expect(axios.get).toHaveBeenCalledWith('https://api.example.test/api/products');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tostadora' } });

    expect(screen.getByRole('heading', { name: 'Tostadora Test' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Licuadora Test' })).toBeNull();
  });

  test('uses saved category preferences as an optional filter, without preventing access to the full catalog', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockResolvedValue({
      data: [
        { _id: 'p1', name: 'Licuadora Test', description: 'Para batidos', price: 150000, category: 'Licuadoras', quantity: 3 },
        { _id: 'p2', name: 'Tostadora Test', description: 'Para desayunos', price: 90000, category: 'Tostadoras', quantity: 4 }
      ]
    });

    renderCatalog({ _id: 'user-1', role: 'user', preferences: ['Licuadoras'] });

    expect(await screen.findByRole('heading', { name: 'Licuadora Test' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Tostadora Test' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /ver todo el catálogo/i }));

    expect(screen.getByRole('heading', { name: 'Licuadora Test' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Tostadora Test' })).toBeTruthy();
  });

  test('demo fixtures cover every preference category with clearly marked sample data', () => {
    const expectedCategories = [
      'Aires Acondicionados',
      'Aspiradoras',
      'Batidoras',
      'Bocinas Inteligentes o Parlantes Bluetooth',
      'Cafeteras',
      'Celulares',
      'Computadores de Escritorio',
      'Computadores Portátiles',
      'Consolas de Videojuegos',
      'Estufas',
      'Impresoras',
      'Lavadoras',
      'Licuadoras',
      'Microondas',
      'Planchas de Ropa',
      'Refrigeradores',
      'Sandwicheras',
      'Secadores de Cabello',
      'Tablets',
      'Televisores',
      'Tostadoras',
      'Ventiladores'
    ];
    const actualCategories = [...new Set(demoProducts.map((product) => product.category))];

    expect(demoProducts.length).toBeGreaterThanOrEqual(expectedCategories.length * 3);
    expect(actualCategories).toHaveLength(expectedCategories.length);
    expect(actualCategories).toEqual(expect.arrayContaining(expectedCategories));
    expect(new Set(demoProducts.map((product) => `${product.category}::${product.name}`)).size).toBe(demoProducts.length);
    expectedCategories.forEach((category) => {
      expect(demoProducts.filter((product) => product.category === category).length).toBeGreaterThanOrEqual(3);
    });
    expect(demoProducts.every((product) => product.demo === true)).toBe(true);
    expect(demoProducts.every((product) => Number.isFinite(product.price) && product.price > 0)).toBe(true);
    expect(demoProducts.every((product) => Number.isInteger(product.quantity) && product.quantity > 0)).toBe(true);
  });

  test('offers an add-to-order link for authenticated customers when products come from the live API', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockResolvedValue({ data: [
      { _id: '507f1f77bcf86cd799439011', name: 'Cafetera conectada', description: 'Demo', price: 45000, category: 'Cafeteras', quantity: 2, demo: true }
    ] });

    renderCatalog({ _id: 'customer-1', role: 'user', preferences: [] });

    expect(await screen.findByRole('heading', { name: 'Cafetera conectada' })).toBeTruthy();
    const addLink = screen.getByRole('link', { name: /agregar a pedido/i });
    expect(addLink.getAttribute('href')).toBe('/pedido-form?productId=507f1f77bcf86cd799439011');
  });

  test('does not offer checkout for local fallback products that have no database identity', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', '');
    renderCatalog({ _id: 'customer-1', role: 'user', preferences: [] });

    expect(await screen.findByText('Catálogo de demostración')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /agregar a pedido/i })).toBeNull();
  });
});
