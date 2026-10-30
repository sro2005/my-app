import React, { useContext } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AuthProvider, { AuthContext } from './AuthContext';

const SessionProbe = () => {
  const { user, handleLogout } = useContext(AuthContext);
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'signed-out'}</span>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
};

describe('AuthProvider session persistence', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('clears malformed persisted session data without deleting unrelated storage', async () => {
    localStorage.setItem('authToken', 'stale-token');
    localStorage.setItem('userData', '{not-json');
    localStorage.setItem('unrelatedPreference', 'keep-me');

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('signed-out'));
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
    expect(localStorage.getItem('unrelatedPreference')).toBe('keep-me');
  });

  it('removes only ElectroVibeHome authentication keys on logout', async () => {
    localStorage.setItem('authToken', 'valid-token');
    localStorage.setItem('userData', JSON.stringify({ _id: 'customer-1', role: 'user', email: 'customer@example.com' }));
    localStorage.setItem('userId', 'customer-1');
    localStorage.setItem('unrelatedPreference', 'keep-me');

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('customer@example.com'));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(screen.getByText('Cerrando tu sesión')).toBeTruthy();
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
    expect(localStorage.getItem('unrelatedPreference')).toBe('keep-me');

    await waitFor(
      () => expect(screen.getByTestId('user').textContent).toBe('signed-out'),
      { timeout: 2000 }
    );
  });
});
