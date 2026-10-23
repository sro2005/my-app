import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import ListadoProductos from './ListadoProductos';

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
  test('shows the local demo catalog when the API URL is not configured', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', '');

    renderCatalog();

    expect(await screen.findByText('Catálogo de demostración')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Aire acondicionado Brisa' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Ventilador Brisa' })).toBeTruthy();
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('falls back to demo products when the API request fails and offers retry', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockRejectedValue(new Error('offline'));

    renderCatalog();

    expect(await screen.findByText('Catálogo de demostración')).toBeTruthy();
    expect(screen.getByRole('button', { name: /reintentar conexión/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Licuadora Viva' })).toBeTruthy();
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
});
