import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { runNmap, type Host, type Port } from "../lib/api";

export default function NmapRunner() {
  const [flags, setFlags] = useState("-T4 -Pn -sV");
  const [targets, setTargets] = useState("");

  const runM = useMutation({
    mutationFn: async () => {
      const flagsArr = flags.split(/\s+/).filter(Boolean);
      const targetsArr = targets.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      return runNmap({ flags: flagsArr, targets: targetsArr });
    },
  });

  const lines = runM.data ? runM.data.stdout.split(/\r?\n/).slice(-2000) : [];
  const hosts: Host[] = runM.data?.hosts || [];

  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">Run Nmap</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Flags</label>
          <input className="input" value={flags} onChange={(e) => setFlags(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Targets</label>
          <textarea
            className="input min-h-[80px]"
            placeholder="scanme.nmap.org\n192.0.2.10"
            value={targets}
            onChange={(e) => setTargets(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="btn"
          disabled={runM.isPending || !targets.trim()}
          onClick={() => runM.mutate()}
        >
          {runM.isPending ? "Running…" : "Run Nmap"}
        </button>
        {runM.isError && <div className="text-red-600">Run failed</div>}
      </div>
      {lines.length > 0 && (
        <pre className="card max-h-[40vh] overflow-auto text-sm font-mono leading-tight whitespace-pre-wrap">
          {lines.join("\n")}
        </pre>
      )}
      {hosts.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-2">Hosts</h3>
          <table className="table w-full text-sm">
            <thead>
              <tr>
                <th>Host</th>
                <th>Port</th>
                <th>Protocol</th>
                <th>Service</th>
              </tr>
            </thead>
            <tbody>
              {hosts.flatMap((h: Host) =>
                h.ports.map((p: Port) => (
                  <tr key={`${h.address}-${p.port_number}-${p.protocol}`}>
                    <td>{h.address}</td>
                    <td>{p.port_number}</td>
                    <td>{p.protocol}</td>
                    <td>{p.service_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
