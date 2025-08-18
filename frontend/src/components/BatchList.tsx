import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listScanBatches, type Batch } from "../lib/api";

export default function BatchList({ scanId }: { scanId: number }) {
  const batchesQ = useQuery({
    queryKey: ["batches", scanId],
    queryFn: () => listScanBatches(scanId),
    refetchInterval: 5000,
  });

  return (
    <div className="mt-4">
      {batchesQ.isLoading ? (
        <div>Loading batches…</div>
      ) : batchesQ.isError ? (
        <div className="text-red-600">Failed to load batches</div>
      ) : (
        <>
          {!batchesQ.data || batchesQ.data.length === 0 ? (
            <div className="text-slate-500">No batches yet.</div>
          ) : (
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Batch ID</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Targets</th>
                  <th className="px-4 py-2">Started At</th>
                  <th className="px-4 py-2">Finished At</th>
                </tr>
              </thead>
              <tbody>
                {batchesQ.data.map((batch: Batch) => (
                  <tr key={batch.id}>
                    <td className="border px-4 py-2">{batch.id}</td>
                    <td className="border px-4 py-2">{batch.status}</td>
                    <td className="border px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        {batch.targets.map((target) => (
                          <Link
                            key={target}
                            to={`/ip/${target}`}
                            className="text-blue-500 hover:underline"
                          >
                            {target}
                          </Link>
                        ))}
                      </div>
                    </td>
                    <td className="border px-4 py-2">
                      {batch.started_at
                        ? new Date(batch.started_at).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="border px-4 py-2">
                      {batch.finished_at
                        ? new Date(batch.finished_at).toLocaleString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
