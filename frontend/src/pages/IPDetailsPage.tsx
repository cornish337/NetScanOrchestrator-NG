import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getTargetHistory, type Scan } from "../lib/api";

export default function IPDetailsPage() {
  const { address } = useParams();

  const historyQ = useQuery({
    queryKey: ["history", address],
    queryFn: () => getTargetHistory(address!),
    enabled: !!address,
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">IP Details: {address}</h1>
      </header>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Scan History</h2>
        {historyQ.isLoading ? (
          <div>Loading history…</div>
        ) : historyQ.isError ? (
          <div className="text-red-600">Failed to load history</div>
        ) : (
          <>
            {!historyQ.data || historyQ.data.length === 0 ? (
              <div className="text-slate-500">No scan history for this IP.</div>
            ) : (
              <table className="table-auto w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Scan ID</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Started At</th>
                    <th className="px-4 py-2">Finished At</th>
                  </tr>
                </thead>
                <tbody>
                  {historyQ.data.map((scan: Scan) => (
                    <tr key={scan.id}>
                      <td className="border px-4 py-2">{scan.id}</td>
                      <td className="border px-4 py-2">{scan.status}</td>
                      <td className="border px-4 py-2">
                        {new Date(scan.started_at).toLocaleString()}
                      </td>
                      <td className="border px-4 py-2">
                        {scan.finished_at
                          ? new Date(scan.finished_at).toLocaleString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>
    </div>
  );
}
