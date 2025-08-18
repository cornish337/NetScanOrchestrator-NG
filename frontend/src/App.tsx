import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LiveLog from "./components/LiveLog";
import NmapRunner from "./components/NmapRunner";
import { createProject, listProjects, startScan, type Project } from "./lib/api";


export default function App() {
  const qc = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [targetsText, setTargetsText] = useState("");
  const [flags, setFlags] = useState("-T4 -Pn -sS");
  const [chunkSize, setChunkSize] = useState(256);
  const [concurrency, setConcurrency] = useState(6);
  const [activeScanId, setActiveScanId] = useState<number | null>(null);

  const projectsQ = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
    staleTime: 5_000,
  });

  const createProjectM = useMutation({
    mutationFn: (input: { name: string; description?: string }) =>
      createProject(input.name, input.description),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const startScanM = useMutation({
    mutationFn: async () => {
      if (!selectedProject) throw new Error("No project selected");
      const targets = targetsText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const nmap_flags = flags.split(/\s+/).filter(Boolean);
      const res = await startScan({
        project_id: selectedProject,
        nmap_flags,
        targets,
        chunk_size: chunkSize,
        concurrency,
      });
      return res;
    },
    onSuccess: (res) => setActiveScanId(res.scan_id),
  });

  const projects = useMemo<Project[]>(() => projectsQ.data ?? [], [projectsQ.data]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">NetScan Orchestrator — UI (MVP)</h1>
        <a className="btn" href="https://github.com/cornish337/NetScanOrchestrator-NG" target="_blank" rel="noreferrer">
          Repo
        </a>
      </header>

      {/* Projects */}
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        {projectsQ.isLoading ? (
          <div>Loading projects…</div>
        ) : projectsQ.isError ? (
          <div className="text-red-600">Failed to load projects</div>
        ) : (
          <>
            {projects.length === 0 ? (
              <div className="text-slate-500">No projects yet — create one below.</div>
            ) : (
              <div className="grid gap-2">
                {projects.map((p) => (
                  <label key={p.id} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="project"
                      checked={selectedProject === p.id}
                      onChange={() => setSelectedProject(p.id)}
                    />
                    <div>
                      <div className="font-medium">{p.name}</div>
                      {p.description && <div className="text-sm text-slate-500">{p.description}</div>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </>
        )}

        <CreateProject onCreate={(name, description) => createProjectM.mutate({ name, description })} />
      </section>

      {/* Start Scan */}
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Start Scan</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nmap flags</label>
            <input className="input" value={flags} onChange={(e) => setFlags(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Chunk size</label>
              <input
                className="input"
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Concurrency</label>
              <input
                className="input"
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="label">Targets (one per line: IP/host or CIDR)</label>
            <textarea
              className="input min-h-[120px]"
              placeholder="192.0.2.10
198.51.100.0/24"
              value={targetsText}
              onChange={(e) => setTargetsText(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="btn"
            disabled={startScanM.isPending || !selectedProject || !targetsText.trim()}
            onClick={() => startScanM.mutate()}
          >
            {startScanM.isPending ? "Starting…" : "Start Scan"}
          </button>
          {startScanM.isError && <div className="text-red-600">Start failed</div>}
          {activeScanId && <div className="text-slate-600">Active scan: #{activeScanId}</div>}
        </div>
      </section>

      {/* Nmap runner */}
      <NmapRunner />

      {/* Live log */}
      {activeScanId && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Live Stream</h2>
          <LiveLog scanId={activeScanId} />
        </section>
      )}
    </div>
  );
}

function CreateProject(props: { onCreate: (name: string, description?: string) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  return (
    <div className="flex items-end gap-3">
      <div className="grow">
        <label className="label">New project name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grow">
        <label className="label">Description (optional)</label>
        <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <button
        className="btn"
        onClick={() => {
          if (!name.trim()) return;
          props.onCreate(name.trim(), desc.trim() || undefined);
          setName(""); setDesc("");
        }}
      >
        Create
      </button>
    </div>
  );
}
