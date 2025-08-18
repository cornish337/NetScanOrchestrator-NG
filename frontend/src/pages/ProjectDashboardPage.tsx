import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startScan } from "../lib/api";
import TargetInput from "../components/TargetInput";
import ScanList from "../components/ScanList";
import { useState } from "react";

export default function ProjectDashboardPage() {
  const { projectId } = useParams();
  const projectIdNum = Number(projectId);
  const qc = useQueryClient();
  const [targets, setTargets] = useState<string[]>([]);
  const [chunkSize, setChunkSize] = useState(256);
  const [nmapFlags, setNmapFlags] = useState("-T4 -Pn -sS");
  const [runner, setRunner] = useState("asyncio");

  const startScanM = useMutation({
    mutationFn: () =>
      startScan({
        project_id: projectIdNum,
        nmap_flags: nmapFlags.split(/\s+/).filter(Boolean),
        targets: targets,
        chunk_size: chunkSize,
        concurrency: 6, // You might want to make this configurable
        runner: runner,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scans", projectIdNum] });
    },
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Project Dashboard</h1>
      </header>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Project ID: {projectId}</h2>
        <TargetInput
          onTargetsChanged={setTargets}
          onChunkSizeChanged={setChunkSize}
        />
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nmap flags</label>
            <input
              className="input"
              value={nmapFlags}
              onChange={(e) => setNmapFlags(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Runner</label>
            <select
              className="input"
              value={runner}
              onChange={(e) => setRunner(e.target.value)}
            >
              <option value="asyncio">Asyncio</option>
              <option value="multiprocessing">Legacy Parallel</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="btn"
            disabled={startScanM.isPending || targets.length === 0}
            onClick={() => startScanM.mutate()}
          >
            {startScanM.isPending ? "Starting…" : "Start Scan"}
          </button>
          {startScanM.isError && (
            <div className="text-red-600">Start failed</div>
          )}
        </div>
      </section>

      <ScanList projectId={projectIdNum} />
    </div>
  );
}
