const API_BASE = (import.meta as any).env?.VITE_API_BASE || "";

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export function wsUrl(path: string): string {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}${API_BASE}${path}`;
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

export async function runNmap(input: RunNmapInput): Promise<{ stdout: string }> {
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

