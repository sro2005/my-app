import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

// Prevent DOM from one test leaking into the next.
afterEach(cleanup);

// The storefront only needs Link to render its destination as an anchor here.
vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));

import LandingPage from './LandingPage';

describe('LandingPage', () => {
  test('renders the main storefront headline and primary navigation', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', { name: /encuentra tecnología que haga más fácil tu día a día/i })
    ).toBeTruthy();
    expect(screen.getByText(/transforma tu hogar con la energía del futuro/i)).toBeTruthy();

    expect(screen.getByRole('link', { name: /explorar productos/i }).getAttribute('href')).toBe('/catalogo');
    expect(screen.getByRole('link', { name: /crear mi cuenta/i }).getAttribute('href')).toBe('/register');
  });

  test('renders the four product categories without exposing internal payment-environment details', () => {
    render(<LandingPage />);

    expect(screen.getByText('Refrigeración')).toBeTruthy();
    expect(screen.getByText('Lavado y cuidado')).toBeTruthy();
    expect(screen.getByText('Cocina')).toBeTruthy();
    expect(screen.getByText('Limpieza del hogar')).toBeTruthy();
    expect(screen.queryByText(/entorno de pruebas|cuenta de demostración|prototipo/i)).toBeNull();
  });

  test('introduces the ElectroVibe guide and links visitors to explore recommendations', () => {
    render(<LandingPage />);
    expect(screen.getByRole('heading', { name: /no elijas a ciegas/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /probar la guía electrovibe/i }).getAttribute('href')).toBe('/catalogo');
    expect(screen.getByText(/descubre sugerencias del catálogo/i)).toBeTruthy();
  });
});
