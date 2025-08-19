// tests/ws-scan.spec.ts
import { test, expect } from '@playwright/test';

test('WebSocket scan stream emits lines', async ({ page }) => {
  // Start a scan via API
  const resp = await page.request.post('http://localhost:8080/api/projects', {
    data: { name: 'ws-test', description: 'WS test project' },
  });
  expect(resp.ok()).toBeTruthy();
  const project = await resp.json();
  const scanResp = await page.request.post('http://localhost:8080/api/scans/start', {
    data: { project_id: project.id, targets: ['127.0.0.1'], profile: 'quick' },
  });
  expect(scanResp.ok()).toBeTruthy();
  const scan = await scanResp.json();

  // Connect to WebSocket and wait for at least one message
  const ws = await page.context().newCDPSession(page);
  const url = `ws://localhost:8080/ws/scans/${scan.scan_id}`;
  const { WebSocket } = require('ws');
  const client = new WebSocket(url);

  let gotLine = false;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('No line message')), 10000);
    client.on('message', (data) => {
      try {
        const evt = JSON.parse(data.toString());
        if (evt.event === 'line') {
          gotLine = true;
          clearTimeout(timer);
          client.close();
          resolve(true);
        }
      } catch { /* ignore */ }
    });
    client.on('error', reject);
  });

  expect(gotLine).toBeTruthy();
});
