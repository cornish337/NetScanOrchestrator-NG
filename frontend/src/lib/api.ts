const API_BASE = "/api";

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export function wsUrl(path: string): string {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}${path}`;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
}

export async function listProjects(): Promise<Project[]> {
  const res = await fetch(apiUrl("/projects"));
  if (!res.ok) throw new Error("Failed to list projects");
  return res.json();
}

export async function createProject(name: string, description?: string) {
  const res = await fetch(apiUrl("/projects"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

interface StartScanInput {
  project_id: number;
  nmap_flags: string[];
  targets: string[];
  chunk_size: number;
  concurrency: number;
  runner: string;
}

export async function startScan(input: StartScanInput) {
  const res = await fetch(apiUrl("/scans/start"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to start scan");
  return res.json();
}

interface RunNmapInput {
  flags: string[];
  targets: string[];
}

export async function runNmap(input: RunNmapInput): Promise<{ stdout: string; hosts: Host[] }> {
  const res = await fetch(apiUrl("/nmap/run"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export interface Scan {
  id: number;
  project_id: number;
  status: string;
  started_at: string;
  finished_at?: string;
}

export async function listProjectScans(projectId: number): Promise<Scan[]> {
  const res = await fetch(apiUrl(`/projects/${projectId}/scans`));
  if (!res.ok) throw new Error("Failed to list project scans");
  return res.json();
}

export interface ListAllScansResponse {
  scans: Scan[];
}

export async function listAllScans(): Promise<ListAllScansResponse> {
  const res = await fetch(apiUrl("/scans"));
  if (!res.ok) throw new Error("Failed to list scans");
  return res.json();
}

export interface Batch {
  id: number;
  scan_id: number;
  status: string;
  target_count: number;
  started_at?: string;
  finished_at?: string;
  targets: string[];
}

export async function listScanBatches(scanId: number): Promise<Batch[]> {
  const res = await fetch(apiUrl(`/scans/${scanId}/batches`));
  if (!res.ok) throw new Error("Failed to list scan batches");
  return res.json();
}

export async function getTargetHistory(address: string): Promise<Scan[]> {
  const res = await fetch(apiUrl(`/targets/${address}/history`));
  if (!res.ok) throw new Error("Failed to get target history");
  return res.json();
}

export async function stopScan(scanId: number) {
  const res = await fetch(apiUrl(`/scans/${scanId}/stop`), {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to stop scan");
  return res.json();
}

export interface Port {
  id: number;
  port_number: number;
  protocol: string;
  state: string;
  service_name?: string;
  service_product?: string;
  service_version?: string;
}

export interface Host {
  id: number;
  scan_id: number;
  address: string;
  hostname?: string;
  status: string;
  ports: Port[];
}

export async function listScanHosts(scanId: number): Promise<Host[]> {
  const res = await fetch(apiUrl(`/scans/${scanId}/hosts`));
  if (!res.ok) throw new Error("Failed to list scan hosts");
  return res.json();
}

export async function getHostDetails(hostId: number): Promise<Host> {
  const res = await fetch(apiUrl(`/hosts/${hostId}`));
  if (!res.ok) throw new Error("Failed to get host details");
  return res.json();
}
