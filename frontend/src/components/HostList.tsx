import { useQuery } from "@tanstack/react-query";
import { listScanHosts, type Host } from "../lib/api";
import { useState } from "react";
import HostDetails from "./HostDetails";

export default function HostList({ scanId }: { scanId: number }) {
  const [selectedHostId, setSelectedHostId] = useState<number | null>(null);

  const hostsQ = useQuery({
    queryKey: ["hosts", scanId],
    queryFn: () => listScanHosts(scanId),
    refetchInterval: 5000,
  });

  if (hostsQ.isLoading) return <div>Loading hosts...</div>;
  if (hostsQ.isError) return <div className="text-red-600">Failed to load hosts</div>;
  if (hostsQ.data.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="font-semibold">Discovered Hosts</h4>
      <ul className="list-disc list-inside">
        {hostsQ.data.map((host: Host) => (
          <li key={host.id}>
            {host.address} ({host.hostname || "no hostname"}) - {host.status}
            <button className="btn btn-sm ml-4" onClick={() => setSelectedHostId(host.id)}>
              {selectedHostId === host.id ? "Hide Details" : "View Details"}
            </button>
          </li>
        ))}
      </ul>
      {selectedHostId && <HostDetails hostId={selectedHostId} />}
    </div>
  );
}
