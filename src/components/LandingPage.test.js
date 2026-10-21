import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

// The storefront only needs Link to render its destination as an anchor here.
vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));

import LandingPage from './LandingPage';

describe('LandingPage', () => {
  test('renders the main storefront headline and primary navigation', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', { name: /tu hogar merece algo extraordinario/i })
    ).toBeTruthy();

    expect(screen.getByRole('link', { name: /explorar productos/i }).getAttribute('href')).toBe('/catalogo');
    expect(screen.getByRole('link', { name: /crear mi cuenta/i }).getAttribute('href')).toBe('/register');
  });

  test('renders the four product categories and official Wompi checkout messaging', () => {
    render(<LandingPage />);

    expect(screen.getByText('Refrigeración')).toBeTruthy();
    expect(screen.getByText('Lavado y cuidado')).toBeTruthy();
    expect(screen.getByText('Cocina')).toBeTruthy();
    expect(screen.getByText('Limpieza del hogar')).toBeTruthy();
    expect(screen.getByText(/el pago se completa en el checkout oficial de wompi/i)).toBeTruthy();
  });
});
