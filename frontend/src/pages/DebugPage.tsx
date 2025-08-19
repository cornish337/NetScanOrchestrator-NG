import { useQuery } from "@tanstack/react-query";
import { fetchScans } from "../lib/api";
import { Scan } from "../lib/api";

export default function DebugPage() {
  const {
    data: scans,
    error,
    isLoading,
  } = useQuery<Scan[]>({
    queryKey: ["scans"],
    queryFn: fetchScans,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching scans: {error.message}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Debug Dashboard</h1>
      <table className="table-auto w-full mt-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Project</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Started At</th>
            <th className="px-4 py-2 text-left">Finished At</th>
          </tr>
        </thead>
        <tbody>
          {scans?.map((scan) => (
            <tr key={scan.id} className="border-b">
              <td className="px-4 py-2">{scan.id}</td>
              <td className="px-4 py-2">{scan.project_name}</td>
              <td className="px-4 py-2">{scan.status}</td>
              <td className="px-4 py-2">{scan.started_at}</td>
              <td className="px-4 py-2">{scan.finished_at || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
