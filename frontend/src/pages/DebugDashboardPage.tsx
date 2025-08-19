import { useQuery } from "@tanstack/react-query";
import { listAllScans } from "../lib/api";

export default function DebugDashboardPage() {
  const scansQ = useQuery({
    queryKey: ["debug-scans"],
    queryFn: listAllScans,
    staleTime: 5_000,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Debug Dashboard</h1>
      {scansQ.isLoading ? (
        <div>Loading scans…</div>
      ) : scansQ.isError ? (
        <div className="text-red-600">Failed to load scans</div>
      ) : (
        <pre className="text-sm overflow-auto">
          {JSON.stringify(scansQ.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
