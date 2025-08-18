import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

async function expandTargets(targets: string[]): Promise<string[]> {
  const res = await fetch("/api/targets/expand", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targets }),
  });
  if (!res.ok) {
    throw new Error("Failed to expand targets");
  }
  const data = await res.json();
  return data.targets;
}

interface TargetInputProps {
  onTargetsChanged: (targets: string[]) => void;
  onChunkSizeChanged: (chunkSize: number) => void;
}

export default function TargetInput({
  onTargetsChanged,
  onChunkSizeChanged,
}: TargetInputProps) {
  const [targetsText, setTargetsText] = useState("");
  const [expandedTargets, setExpandedTargets] = useState<string[]>([]);
  const [chunkSize, setChunkSize] = useState(256);

  useEffect(() => {
    onTargetsChanged(expandedTargets);
  }, [expandedTargets, onTargetsChanged]);

  useEffect(() => {
    onChunkSizeChanged(chunkSize);
  }, [chunkSize, onChunkSizeChanged]);

  const expandM = useMutation({
    mutationFn: (targets: string[]) => expandTargets(targets),
    onSuccess: (data) => {
      setExpandedTargets(data);
    },
  });

  const handlePreview = () => {
    const targets = targetsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    expandM.mutate(targets);
  };

  const chunks = [];
  for (let i = 0; i < expandedTargets.length; i += chunkSize) {
    chunks.push(expandedTargets.slice(i, i + chunkSize));
  }

  return (
    <div className="space-y-4">
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

      <div className="flex items-center gap-3">
        <button
          className="btn"
          disabled={expandM.isPending || !targetsText.trim()}
          onClick={handlePreview}
        >
          {expandM.isPending ? "Expanding..." : "Preview Targets"}
        </button>
        <div className="flex items-center gap-2">
          <label className="label">Chunk size</label>
          <input
            className="input"
            type="number"
            value={chunkSize}
            onChange={(e) => setChunkSize(Number(e.target.value))}
          />
        </div>
      </div>

      {expandedTargets.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold">
            Expanded Targets ({expandedTargets.length})
          </h3>
          <p>Chunked into {chunks.length} batches.</p>
          <div className="max-h-64 overflow-y-auto border rounded-md p-2 mt-2">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Chunk</th>
                  <th className="px-4 py-2">Targets</th>
                </tr>
              </thead>
              <tbody>
                {chunks.map((chunk, i) => (
                  <tr key={i}>
                    <td className="border px-4 py-2">{i + 1}</td>
                    <td className="border px-4 py-2">{chunk.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
