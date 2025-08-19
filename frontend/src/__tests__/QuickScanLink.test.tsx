import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { expect, test } from 'vitest';
import App from '../App';

test('Quick Scan link navigates to NmapRunner', () => {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );

  const link = screen.getByRole('link', { name: /quick scan/i });
  fireEvent.click(link);
  expect(screen.getByRole('heading', { name: /run nmap/i })).toBeInTheDocument();
});
