import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from './LandingPage';

const renderLandingPage = () => render(
  <MemoryRouter>
    <LandingPage />
  </MemoryRouter>
);

describe('LandingPage', () => {
  test('renders the main storefront headline and primary navigation', () => {
    renderLandingPage();

    expect(
      screen.getByRole('heading', { name: /tu hogar merece algo extraordinario/i })
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /explorar productos/i })).toHaveAttribute('href', '/catalogo');
    expect(screen.getByRole('link', { name: /crear mi cuenta/i })).toHaveAttribute('href', '/register');
  });

  test('renders the four product categories and official Wompi checkout messaging', () => {
    renderLandingPage();

    expect(screen.getByText('Refrigeración')).toBeInTheDocument();
    expect(screen.getByText('Lavado y cuidado')).toBeInTheDocument();
    expect(screen.getByText('Cocina')).toBeInTheDocument();
    expect(screen.getByText('Limpieza del hogar')).toBeInTheDocument();
    expect(screen.getByText(/el pago se completa en el checkout oficial de wompi/i)).toBeInTheDocument();
  });
});
