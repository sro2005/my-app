import React from 'react';

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import ListadoProductos from './ListadoProductos';
import demoProducts from '../../data/demo-products.json';
import catalogCategoryGroups from '../utils/catalogCategoryGroups';

vi.mock('axios', () => ({
  default: { get: vi.fn() }
}));

vi.mock('./ShoppingAssistant', () => ({
  default: () => null
}));

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  if (originalScrollIntoView) {
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  } else {
    delete HTMLElement.prototype.scrollIntoView;
  }
});

const renderCatalog = (user = null) => render(
  <AuthContext.Provider value={{ user }}>
    <ListadoProductos />
  </AuthContext.Provider>
);

describe('ListadoProductos', () => {
  test('shows the shared branded loading panel instead of a rotating wheel', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    let finishRequest;
    axios.get.mockReturnValue(new Promise(resolve => { finishRequest = resolve; }));

    renderCatalog();

    expect(screen.getByRole('status').textContent).toMatch(/Preparando el catálogo/i);
    expect(screen.queryByText(/Cargando catálogo/i)).toBeNull();

    finishRequest({ data: [] });
    expect(await screen.findByRole('heading', { name: /encuentra tu próximo favorito/i })).toBeTruthy();
  });

  test('shows the local demo catalog when the API URL is not configured', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', '');

    renderCatalog();

    expect(await screen.findByText('Disponibilidad pendiente de verificación')).toBeTruthy();
    expect(screen.getByRole('heading', { name: demoProducts[0].name })).toBeTruthy();
    expect(screen.getByRole('heading', { name: demoProducts[1].name })).toBeTruthy();
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('falls back to demo products when the API request fails and offers retry', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockRejectedValue(new Error('offline'));

    renderCatalog();

    expect(await screen.findByText('Disponibilidad pendiente de verificación')).toBeTruthy();
    expect(screen.getByRole('button', { name: /actualizar/i })).toBeTruthy();
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

    const searchbox = screen.getByRole('searchbox');
    expect(searchbox.closest('.evh-catalog-search').querySelector('svg.evh-catalog-search-icon')).toBeTruthy();
    fireEvent.change(searchbox, { target: { value: 'tostadora' } });

    expect(screen.getByRole('button', { name: /restablecer/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Tostadora Test' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Licuadora Test' })).toBeNull();
  });

  test('opens a catalog collection from the homepage category link and can clear it', async () => {
    window.history.replaceState({}, '', '/catalogo?grupo=cocina');
    vi.stubEnv('REACT_APP_API_BASE_URL', '');

    renderCatalog();

    expect(await screen.findByText('Colección: Cocina')).toBeTruthy();
    expect(document.querySelectorAll('.evh-product-card')).toHaveLength(21);
    expect(screen.getByRole('heading', { name: /encuentra tu próximo favorito/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /restablecer/i }));

    expect(screen.queryByText('Colección: Cocina')).toBeNull();
    expect(document.querySelectorAll('.evh-product-card')).toHaveLength(66);
  });

  test('scrolls directly to the guide when the catalog route has its guide hash', async () => {
    window.history.replaceState({}, '', '/catalogo#guia-electrovibe');
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView
    });
    vi.stubEnv('REACT_APP_API_BASE_URL', '');

    renderCatalog();

    expect(await screen.findByText('Disponibilidad pendiente de verificación')).toBeTruthy();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(document.getElementById('guia-electrovibe')).toBeTruthy();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  test('homepage collection definitions map all real product categories without duplicates', () => {
    const groupedCategories = catalogCategoryGroups.flatMap(group => group.categories);
    const actualCategories = [...new Set(demoProducts.map(product => product.category))];

    expect(groupedCategories).toHaveLength(actualCategories.length);
    expect(new Set(groupedCategories).size).toBe(groupedCategories.length);
    expect(groupedCategories).toEqual(expect.arrayContaining(actualCategories));
    expect(actualCategories).toEqual(expect.arrayContaining(groupedCategories));
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

  test('renders a matching vector illustration for all 66 demo products across all 22 categories', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', '');
    renderCatalog();

    expect(await screen.findByText('Disponibilidad pendiente de verificación')).toBeTruthy();
    const productCards = document.querySelectorAll('.evh-product-card');
    expect(productCards).toHaveLength(66);
    productCards.forEach((card) => {
      expect(card.querySelector('svg.evh-appliance-icon')).toBeTruthy();
      expect(card.querySelector('.evh-product-art small')).toBeNull();
    });
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

    expect(await screen.findByText('Disponibilidad pendiente de verificación')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /agregar a pedido/i })).toBeNull();
  });
});
