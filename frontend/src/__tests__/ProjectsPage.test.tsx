import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { rest, HttpResponse } from 'msw';
import { beforeAll, afterEach, afterAll, expect, test } from 'vitest';
import Projects from '../pages/ProjectsPage';

const server = setupServer(
  rest.get('/api/projects', () => {
    return HttpResponse.json([
      { id: 1, name: 'Project Alpha', description: 'First' }
    ]);
  }),
  rest.get('/api/scans', () => {
    return HttpResponse.json({ scans: [] });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('renders project list from API', async () => {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Projects />
      </MemoryRouter>
    </QueryClientProvider>
  );

  expect(await screen.findByText('Project Alpha')).toBeInTheDocument();
});
