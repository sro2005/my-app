import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import demoProducts from '../../data/demo-products.json';
import catalogCategoryGroups from '../utils/catalogCategoryGroups';

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
      screen.getByRole('heading', { name: /un hogar que funciona mejor/i })
    ).toBeTruthy();
    expect(screen.getByText(/ELECTRODOMÉSTICOS Y TECNOLOGÍA PARA TU HOGAR/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /explorar el catálogo/i }).getAttribute('href')).toBe('/catalogo');
    expect(screen.queryByText(/primera vez en electrovibehome|crea tu cuenta/i)).toBeNull();
  });

  test('shows category collections that cover every real catalog category exactly once', () => {
    render(<LandingPage />);

    const cards = screen.getAllByRole('link', { name: /ver \d+ categor(?:ía|ías) en el catálogo/i });
    expect(cards).toHaveLength(catalogCategoryGroups.length);
    expect(screen.getByText('Refrigeración')).toBeTruthy();
    expect(screen.getByText('Lavado y cuidado')).toBeTruthy();
    expect(screen.getByText('Cocina')).toBeTruthy();
    expect(screen.getByText('Limpieza del hogar')).toBeTruthy();
    expect(screen.getByText('Climatización')).toBeTruthy();
    expect(screen.getByText('Cuidado personal')).toBeTruthy();
    expect(screen.getByText('Tecnología y entretenimiento')).toBeTruthy();

    const groupedCategories = catalogCategoryGroups.flatMap(group => group.categories);
    const actualCategories = [...new Set(demoProducts.map(product => product.category))];
    expect(groupedCategories).toHaveLength(actualCategories.length);
    expect(new Set(groupedCategories).size).toBe(groupedCategories.length);
    expect(groupedCategories).toEqual(expect.arrayContaining(actualCategories));
    expect(actualCategories).toEqual(expect.arrayContaining(groupedCategories));

    catalogCategoryGroups.forEach(group => {
      const card = cards.find(item => item.getAttribute('href') === `/catalogo?grupo=${group.slug}`);
      expect(card).toBeTruthy();
      expect(within(card).getByText(group.name)).toBeTruthy();
      expect(within(card).getByText(group.preview)).toBeTruthy();
    });
  });

  test('sends visitors to the guide section below the products inside the catalog', () => {
    render(<LandingPage />);

    const guideLinks = screen.getAllByRole('link', { name: /probar la guía electrovibe/i });
    expect(guideLinks).toHaveLength(2);
    guideLinks.forEach(link => {
      expect(link.getAttribute('href')).toBe('/catalogo#guia-electrovibe');
    });
    expect(screen.getByRole('heading', { name: /cuéntanos qué quieres mejorar en casa/i })).toBeTruthy();
    expect(screen.getByText(/orientación gratuita basada en el catálogo disponible/i)).toBeTruthy();
  });

  test('keeps the homepage copy free of unsupported payment or AI claims', () => {
    render(<LandingPage />);

    expect(screen.queryByText(/cobros reales|pasarela|inteligencia artificial|IA de pago/i)).toBeNull();
    expect(screen.queryByText(/entorno de pruebas|cuenta de demostración|prototipo/i)).toBeNull();
  });
});
