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
  test('explains that the guide is not configured yet', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockResolvedValue({ data: { enabled: false } });

    render(<ShoppingAssistant />);

    expect(await screen.findByText(/la guía está en preparación/i)).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  test('sends a product question to the backend and shows its reply', async () => {
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
