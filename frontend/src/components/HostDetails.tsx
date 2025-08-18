import { useQuery } from "@tanstack/react-query";
import { getHostDetails, type Port } from "../lib/api";

export default function HostDetails({ hostId }: { hostId: number }) {
  const hostQ = useQuery({
    queryKey: ["host", hostId],
    queryFn: () => getHostDetails(hostId),
  });

  if (hostQ.isLoading) return <div>Loading host details...</div>;
  if (hostQ.isError) return <div className="text-red-600">Failed to load host details</div>;
  if (!hostQ.data) return <div>No data</div>;

  const { address, hostname, status, ports } = hostQ.data;

  return (
    <div className="mt-4 card">
      <h5 className="font-semibold">Details for {address}</h5>
      <p>Hostname: {hostname || "N/A"}</p>
      <p>Status: {status}</p>
      <h6 className="font-semibold mt-2">Open Ports</h6>
      <table className="table w-full">
        <thead>
          <tr>
            <th>Port</th>
            <th>Protocol</th>
            <th>State</th>
            <th>Service</th>
            <th>Product</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>
          {ports.map((port: Port) => (
            <tr key={port.id}>
              <td>{port.port_number}</td>
              <td>{port.protocol}</td>
              <td>{port.state}</td>
              <td>{port.service_name}</td>
              <td>{port.service_product}</td>
              <td>{port.service_version}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
