import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import ShoppingAssistant from './ShoppingAssistant';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn() }
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('ShoppingAssistant', () => {
  test('provides local catalogue guidance when generative AI is not configured', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockResolvedValue({ data: { enabled: false } });
    const products = [
      {
        id: 'cafetera-demo',
        name: 'CaféMio Program 12',
        category: 'Cafeteras',
        description: 'Cafetera de goteo programable para doce tazas.',
        price: 229900,
        quantity: 5,
        demo: true
      },
      {
        id: 'portatil-demo',
        name: 'Notebook Work 14',
        category: 'Computadores Portátiles',
        description: 'Computador portátil para estudio y oficina.',
        price: 1899900,
        quantity: 3,
        demo: true
      }
    ];

    render(<ShoppingAssistant products={products} />);

    expect(await screen.findByText(/modo de demostración local/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /cocina pequeña/i }).disabled).toBe(false);
    const input = await screen.findByRole('textbox', { name: /escribe qué necesitas/i });
    fireEvent.change(input, { target: { value: 'cafetera para preparar café' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pregunta/i }));

    expect(await screen.findByText(/CaféMio Program 12/i)).toBeTruthy();
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('sends a product question to the backend only when generative AI is enabled', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockResolvedValue({ data: { enabled: true } });
    axios.post.mockResolvedValue({ data: { reply: 'Para ese espacio, revisa las opciones compactas disponibles.' } });

    render(<ShoppingAssistant />);

    const input = await screen.findByRole('textbox', { name: /escribe qué necesitas/i });
    fireEvent.change(input, { target: { value: 'Busco algo para una cocina pequeña.' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pregunta/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalledWith(
      'https://api.example.test/api/assistant/chat',
      { messages: [{ role: 'assistant', content: expect.any(String) }, { role: 'user', content: 'Busco algo para una cocina pequeña.' }] }
    ));
    expect(await screen.findByText(/revisa las opciones compactas disponibles/i)).toBeTruthy();
  });
});
