import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import PerfilCliente from './PerfilCliente';

vi.mock('axios', () => ({
  default: { get: vi.fn(), put: vi.fn() }
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  localStorage.clear();
});

const customer = {
  _id: '507f1f77bcf86cd799439011',
  role: 'user',
  firstName: 'Santy',
  lastName: 'Rojas',
  email: 'santy@example.test',
  birthDate: '1998-01-06T00:00:00.000Z',
  identificationNumber: '1.234.567',
  phone: '300 123 4567',
  preferences: ['Licuadoras', 'Refrigeradores']
};

const renderProfile = (updateUser = vi.fn(), user = customer) => render(
  <MemoryRouter>
    <AuthContext.Provider value={{ user, updateUser }}>
      <PerfilCliente />
    </AuthContext.Provider>
  </MemoryRouter>
);

describe('PerfilCliente', () => {
  test('uses the shared branded loading panel while profile data is being fetched', () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    localStorage.setItem('authToken', 'test-token');
    axios.get.mockReturnValue(new Promise(() => {}));

    renderProfile();

    expect(screen.getByRole('status').textContent).toMatch(/Preparando tu perfil/i);
    expect(screen.queryByText(/Cargando tu perfil/i)).toBeNull();
  });

  test('loads profile data, saves changes and updates the session context', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    localStorage.setItem('authToken', 'test-token');
    const updateUser = vi.fn();
    axios.get.mockResolvedValue({ data: customer });
    axios.put.mockResolvedValue({
      data: { updatedCustomer: { ...customer, firstName: 'Santyro' } }
    });

    renderProfile(updateUser);

    expect(await screen.findByText('santy@example.test')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /editar perfil/i }));
    fireEvent.change(screen.getByLabelText('Nombre(s)'), { target: { value: 'Santyro' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(await screen.findByText('Tu perfil se actualizó correctamente.')).toBeTruthy();
    expect(axios.put).toHaveBeenCalledWith(
      'https://api.example.test/api/customers/' + customer._id,
      expect.objectContaining({ firstName: 'Santyro', preferences: ['Licuadoras', 'Refrigeradores'] }),
      { headers: { Authorization: 'Bearer test-token' } }
    );
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Santyro' }));
  });

  test('shows cached session information read-only if the API URL is missing', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', '');
    localStorage.setItem('authToken', 'test-token');

    renderProfile(vi.fn());

    expect(await screen.findByText(/Vista de solo lectura/i)).toBeTruthy();
    expect(screen.getByText('santy@example.test')).toBeTruthy();
    expect(screen.getByRole('button', { name: /editar perfil/i }).disabled).toBe(true);
    expect(axios.get).not.toHaveBeenCalled();
  });
});
