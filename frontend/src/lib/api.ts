import type { Project, StartScanReq, StartScanRes } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function createProject(name: string, description?: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

export async function listProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error("Failed to list projects");
  return res.json();
}

export async function startScan(payload: StartScanReq): Promise<StartScanRes> {
  const res = await fetch(`${API_BASE}/scans/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to start scan");
  return res.json();
}

export function wsUrl(path: string): string {
  const base = API_BASE || window.location.origin;
  const url = new URL(path, base);
  url.protocol = url.protocol.replace("http", "ws");
  return url.toString();
}

// Convenience helper to run a single Nmap batch for a project
export async function runNmap(
  projectId: number,
  targets: string[],
  flags: string[] = ["-T4", "-Pn", "-sS"]
): Promise<StartScanRes> {
  return startScan({
    project_id: projectId,
    targets,
    nmap_flags: flags,
    chunk_size: targets.length,
    concurrency: 1,
  });
}

export type { Project, StartScanRes };
