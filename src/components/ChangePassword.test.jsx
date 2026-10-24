import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import ChangePassword from './ChangePassword';

vi.mock('axios', () => ({ default: { put: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  localStorage.clear();
});

const renderChangePassword = () => {
  localStorage.setItem('authToken', ['valid', 'mock', 'token'].join('-'));
  vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
  return render(
    <MemoryRouter initialEntries={['/seguridad']}>
      <ChangePassword />
    </MemoryRouter>
  );
};

const fillPasswordFields = (current, next, confirm = next) => {
  fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('Confirma la nueva contraseña'), { target: { value: confirm } });
};

describe('ChangePassword', () => {
  test('checks confirmation before sending a password-change request', async () => {
    renderChangePassword();
    const current = ['Old', 'Test', 'Pass', '1!'].join('');
    const next = ['New', 'Mock', 'Pass', '2!'].join('');
    const other = ['Other', 'Mock', 'Pass', '3!'].join('');
    fillPasswordFields(current, next, other);
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar contraseña' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/confirmación no coincide/i);
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('sends the change with the current session token and clears secrets on success', async () => {
    axios.put.mockResolvedValueOnce({ data: { message: 'Contraseña actualizada correctamente.' } });
    renderChangePassword();
    const current = ['Old', 'Test', 'Pass', '1!'].join('');
    const next = ['New', 'Mock', 'Pass', '2!'].join('');
    fillPasswordFields(current, next);
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar contraseña' }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'https://api.example.test/api/auth/change-password',
        { currentPassword: current, newPassword: next },
        { headers: { Authorization: 'Bearer ' + ['valid', 'mock', 'token'].join('-') } }
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent(/actualizada correctamente/i);
    expect(screen.getByLabelText('Contraseña actual').value).toBe('');
    expect(screen.getByLabelText('Nueva contraseña').value).toBe('');
    expect(screen.getByLabelText('Confirma la nueva contraseña').value).toBe('');
  });
});
