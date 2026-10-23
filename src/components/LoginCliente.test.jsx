import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import LoginCliente from './LoginCliente';

vi.mock('axios', () => ({
  default: { post: vi.fn() }
}));

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('LoginCliente', () => {
  test('renders a branded, labelled sign-in form', () => {
    render(
      <AuthContext.Provider value={{ handleLoginSuccess: vi.fn() }}>
        <LoginCliente />
      </AuthContext.Provider>
    );

    expect(screen.getByRole('heading', { name: /qué bueno verte de nuevo/i })).toBeTruthy();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeTruthy();
    expect(screen.getByLabelText(/contraseña/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /¿olvidaste tu contraseña/i }).getAttribute('href')).toBe('/recover-password');
  });

  test('shows an unavailable state instead of calling an undefined API URL', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', '');
    render(
      <AuthContext.Provider value={{ handleLoginSuccess: vi.fn() }}>
        <LoginCliente />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'cliente@example.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'StrongPass1!' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar a mi cuenta/i }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(axios.post).not.toHaveBeenCalled();
  });
});
