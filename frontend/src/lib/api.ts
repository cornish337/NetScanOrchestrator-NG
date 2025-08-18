import type { Project, StartScanReq, StartScanRes } from "./types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "";

function apiUrl(path: string): string {
return ${API_BASE}${path};
}

export function wsUrl(path: string): string {
const proto = location.protocol === "https:" ? "wss" : "ws";
return ${proto}://${location.host}${API_BASE}${path};
}

export async function listProjects(): Promise<Project[]> {
const res = await fetch(apiUrl("/projects"));
if (!res.ok) throw new Error("Failed to list projects");
return res.json();
}

export async function createProject(name: string, description?: string): Promise<Project> {
const res = await fetch(apiUrl("/projects"), {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ name, description }),
});
if (!res.ok) throw new Error("Failed to create project");
return res.json();
}

export async function startScan(payload: StartScanReq): Promise<StartScanRes> {
const res = await fetch(apiUrl("/scans/start"), {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(payload),
});
if (!res.ok) throw new Error("Failed to start scan");
return res.json();
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