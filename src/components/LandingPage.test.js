import React from 'react';
import { render, screen } from '@testing-library/react';

// Keep this component test independent from the router package implementation.
// The storefront only needs Link to render its destination as an anchor here.
jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}), { virtual: true });

import LandingPage from './LandingPage';

describe('LandingPage', () => {
  test('renders the main storefront headline and primary navigation', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', { name: /tu hogar merece algo extraordinario/i })
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /explorar productos/i })).toHaveAttribute('href', '/catalogo');
    expect(screen.getByRole('link', { name: /crear mi cuenta/i })).toHaveAttribute('href', '/register');
  });

  test('renders the four product categories and official Wompi checkout messaging', () => {
    render(<LandingPage />);

    expect(screen.getByText('Refrigeración')).toBeInTheDocument();
    expect(screen.getByText('Lavado y cuidado')).toBeInTheDocument();
    expect(screen.getByText('Cocina')).toBeInTheDocument();
    expect(screen.getByText('Limpieza del hogar')).toBeInTheDocument();
    expect(screen.getByText(/el pago se completa en el checkout oficial de wompi/i)).toBeInTheDocument();
  });
});
