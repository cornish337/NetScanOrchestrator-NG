import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { rest, HttpResponse } from 'msw';
import App from '../App';

const server = setupServer(
  rest.get('/api/projects', () => HttpResponse.json([])),
  rest.get('/api/scans', () => HttpResponse.json({ scans: [] }))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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
