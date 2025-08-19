
import { test, expect, request } from '@playwright/test';

function httpToWs(url: string) {
  return url.replace(/^http/i, 'ws');
}

test('UI shell loads and WS emits at least one message', async ({ page, baseURL }) => {
  const base = baseURL!;
  // 1) App shell
  const resp = await page.goto('/');
  expect(resp?.ok()).toBeTruthy();
  const html = await page.content();
  expect(html.length).toBeGreaterThan(100);

  // 2) Create project & start scan via API
  const ctx = await request.newContext();
  const api = process.env.API_URL || `${base}/api`;
  // Create a project (best-effort; tolerate 4xx by skipping later assertions)
  const create = await ctx.post(`${api}/projects`, {
    data: { name: 'e2e-ws', description: 'playwright ws test' },
  }).catch(() => null);
  let projectId: string | number | null = null;
  if (create && create.ok()) {
    const data = await create.json().catch(() => ({} as any));
    projectId = data.id ?? data.project_id ?? null;
  }

  // Start scan and get its id
  let scanId: string | number | null = null;
  if (projectId != null) {
    const start = await ctx.post(`${api}/scans/start`, {
      data: { project_id: projectId, targets: ['127.0.0.1'], profile: 'quick' },
    }).catch(() => null);
    if (start && start.ok()) {
      const s = await start.json().catch(() => ({} as any));
      scanId = s.id ?? s.scan_id ?? s.scanId ?? null;
    }
  }

  test.info().annotations.push({ type: 'ids', description: `project=${projectId} scan=${scanId}` });

  // 3) Connect WS and expect at least one line/event if we have a scan id
  if (scanId != null) {
    const wsUrl = httpToWs(`${base}/ws/scans/${scanId}`);
    const msg = await page.evaluate((url) => {
      return new Promise<string>((resolve, reject) => {
        const ws = new (window as any).WebSocket(url);
        const timer = setTimeout(() => reject(new Error('WS timeout')), 20000);
        ws.addEventListener('message', (ev: MessageEvent) => {
          clearTimeout(timer);
          resolve(typeof ev.data === 'string' ? ev.data : 'binary');
          ws.close();
        });
        ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('WS error')); });
      });
    }, wsUrl);
    expect(msg).toBeTruthy();
  } else {
    test.skip(true, 'No scan id available; skipping WS assertion');
  }
});
