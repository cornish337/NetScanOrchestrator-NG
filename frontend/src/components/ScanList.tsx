import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listProjectScans, stopScan, type Scan } from "../lib/api";
import BatchList from "./BatchList";
import LiveLog from "./LiveLog";
import HostList from "./HostList";

export default function ScanList({ projectId }: { projectId: number }) {
  const qc = useQueryClient();
  const scansQ = useQuery({
    queryKey: ["scans", projectId],
    queryFn: () => listProjectScans(projectId),
    refetchInterval: 5000,
  });

  const stopScanM = useMutation({
    mutationFn: (scanId: number) => stopScan(scanId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scans"] });
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Scans</h2>
      {scansQ.isLoading ? (
        <div>Loading scans…</div>
      ) : scansQ.isError ? (
        <div className="text-red-600">Failed to load scans</div>
      ) : (
        <>
          {scansQ.data.length === 0 ? (
            <div className="text-slate-500">No scans yet.</div>
          ) : (
            <div className="space-y-4">
              {scansQ.data.map((scan: Scan) => (
                <div key={scan.id} className="card">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Scan #{scan.id}</h3>
                    <div className="text-sm text-slate-500">
                      {scan.status} - {new Date(scan.started_at).toLocaleString()}
                    </div>
                    {scan.status === "running" && (
                      <button
                        className="btn btn-danger"
                        onClick={() => stopScanM.mutate(scan.id)}
                        disabled={stopScanM.isPending}
                      >
                        {stopScanM.isPending ? "Stopping..." : "Stop Scan"}
                      </button>
                    )}
                  </div>
                  <BatchList scanId={scan.id} />
                  {scan.status === "running" && <LiveLog scanId={scan.id} />}
                  <HostList scanId={scan.id} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
