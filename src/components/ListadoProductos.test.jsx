import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import ListadoProductos from './ListadoProductos';

vi.mock('axios', () => ({
  default: { get: vi.fn() }
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  localStorage.clear();
});

const renderCatalog = () => render(
  <AuthContext.Provider value={{ user: null }}>
    <ListadoProductos />
  </AuthContext.Provider>
);

describe('ListadoProductos', () => {
  test('shows a recoverable message instead of requesting the current page when the API URL is missing', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', '');

    renderCatalog();

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /tu catálogo te espera/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /cargar de nuevo/i })).toBeTruthy();
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('rejects an unexpected API response shape and allows retrying', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockResolvedValue({ data: { message: 'Backend unavailable' } });

    renderCatalog();

    expect(await screen.findByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /cargar de nuevo/i }));

    await waitFor(() => {
      const productRequests = axios.get.mock.calls.filter(([url]) => url.includes('/api/products'));
      expect(productRequests).toHaveLength(2);
    });
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  test('renders products from the expected API response', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockResolvedValue({
      data: [{ _id: 'product-1', name: 'Licuadora', description: 'Compacta', price: 120000, category: 'Cocina', quantity: 3 }]
    });

    renderCatalog();

    expect(await screen.findByText('Licuadora')).toBeTruthy();
    expect(screen.getByText(/3 unidades/i)).toBeTruthy();
  });
});
