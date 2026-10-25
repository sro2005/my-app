import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import RecoverPassword from './RecoverPassword';

vi.mock('axios', () => ({
  default: { post: vi.fn() }
}));

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));

vi.mock('./FormPage', () => ({
  default: ({ title, description, children }) => (
    <main>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </main>
  )
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

const fillAndSubmit = email => {
  fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: email } });
  fireEvent.submit(screen.getByLabelText(/correo electrónico/i).closest('form'));
};

describe('RecoverPassword', () => {
  test('renders a labelled recovery form and a login link', () => {
    render(<RecoverPassword />);

    expect(screen.getByRole('heading', { name: /volvamos a conectarte/i })).toBeTruthy();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /volver a iniciar sesión/i }).getAttribute('href')).toBe('/login');
  });

  test('does not make a request if the backend URL is missing', () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', ' ');
    render(<RecoverPassword />);

    fillAndSubmit('cliente@example.com');

    expect(screen.getByRole('status').textContent).toMatch(/recuperación no está disponible/i);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('sends the requested email and displays the generic backend response', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test/');
    axios.post.mockResolvedValue({
      data: { message: 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.' }
    });
    render(<RecoverPassword />);

    fillAndSubmit('cliente@example.com');

    expect(await screen.findByText(/si el correo está registrado/i)).toBeTruthy();
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.example.test/api/customers/forgot-password',
      { email: 'cliente@example.com' },
      { timeout: 15000 }
    );
  });

  test('shows a clear message when the backend reports unavailable email delivery', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.post.mockRejectedValue({
      response: { data: { message: 'El servicio de recuperación de contraseña no está disponible temporalmente. Inténtalo de nuevo más tarde.' } }
    });
    render(<RecoverPassword />);

    fillAndSubmit('cliente@example.com');

    expect(await screen.findByText(/servicio de recuperación de contraseña no está disponible/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /enviar enlace seguro/i }).disabled).toBe(false);
  });

  test('stops loading and shows a clear message when the request times out', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.post.mockRejectedValue({ code: 'ECONNABORTED' });
    render(<RecoverPassword />);

    fillAndSubmit('cliente@example.com');

    expect(await screen.findByText(/la solicitud tardó demasiado/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /enviar enlace seguro/i }).disabled).toBe(false);
  });

  test('shows a safe connection message when the request cannot reach the backend', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.post.mockRejectedValue(new Error('network unreachable'));
    render(<RecoverPassword />);

    fillAndSubmit('cliente@example.com');

    expect(await screen.findByText(/no pudimos conectar con el servicio/i)).toBeTruthy();
  });
});
