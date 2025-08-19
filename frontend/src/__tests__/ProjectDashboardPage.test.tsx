import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { rest, HttpResponse } from 'msw';
import { vi, beforeAll, afterEach, afterAll, expect, test, waitFor } from 'vitest';
import ProjectDashboardPage from '../pages/ProjectDashboardPage';
import React from 'react';

vi.mock('../components/TargetInput', () => ({
  default: ({ onTargetsChanged, onChunkSizeChanged }: any) => {
    onTargetsChanged(['192.0.2.1']);
    onChunkSizeChanged(1);
    return <div>TargetInputMock</div>;
  },
}));

vi.mock('../components/ScanList', () => ({
  default: () => <div>ScanListMock</div>,
}));

let startScanCalled = false;
const server = setupServer(
  rest.post('/api/scans/start', async ({ request }) => {
    startScanCalled = true;
    return HttpResponse.json({ id: 1 });
  })
);

beforeAll(() => server.listen());
afterEach(() => { server.resetHandlers(); startScanCalled = false; });
afterAll(() => server.close());

test('starts a scan via API', async () => {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/projects/1']}>
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectDashboardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  const button = await screen.findByRole('button', { name: /start scan/i });
  fireEvent.click(button);

  await waitFor(() => {
    expect(startScanCalled).toBe(true);
  });
});
