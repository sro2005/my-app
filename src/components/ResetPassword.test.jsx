import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import ResetPassword from './ResetPassword';

vi.mock('axios', () => ({
  default: { post: vi.fn() }
}));

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => ({ token: 'a'.repeat(64) })
}));

vi.mock('./FormPage', () => ({
  default: ({ children }) => <div>{children}</div>
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

const fillPasswordForm = (password, confirmation = password) => {
  fireEvent.change(screen.getByLabelText(/nueva contraseña/i), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: confirmation } });
  fireEvent.submit(screen.getByLabelText(/nueva contraseña/i).closest('form'));
};

describe('ResetPassword', () => {
  test('requires the backend password policy before calling the API', async () => {
    render(<ResetPassword />);

    fillPasswordForm('weakpassword');

    expect(screen.getByRole('alert').textContent).toMatch(/mayúscula, minúscula, número y símbolo/i);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('sends a strong matching password and displays the success message', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.post.mockResolvedValue({ data: { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' } });
    render(<ResetPassword />);

    fillPasswordForm('StrongPass1!');

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(axios.post).toHaveBeenCalledWith(
      `https://api.example.test/api/customers/reset-password/${'a'.repeat(64)}`,
      { password: 'StrongPass1!' }
    );
    expect(screen.getByRole('link', { name: /ir a iniciar sesión/i }).getAttribute('href')).toBe('/login');
  });

  test('rejects mismatched password confirmation without calling the API', () => {
    render(<ResetPassword />);

    fillPasswordForm('StrongPass1!', 'StrongPass2!');

    expect(screen.getByRole('alert').textContent).toMatch(/deben coincidir/i);
    expect(axios.post).not.toHaveBeenCalled();
  });
});
