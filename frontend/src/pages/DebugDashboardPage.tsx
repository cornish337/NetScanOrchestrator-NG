import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listAllScans, type ScanWithProject } from "../lib/api";
import LiveLog from "../components/LiveLog";
import HostList from "../components/HostList";

export default function DebugDashboardPage() {
  const scansQ = useQuery({
    queryKey: ["all_scans"],
    queryFn: listAllScans,
    refetchInterval: 5000,
  });

  const [openLogId, setOpenLogId] = useState<number | null>(null);
  const [openHostsId, setOpenHostsId] = useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Debug Dashboard</h1>
      </header>
      {scansQ.isLoading ? (
        <div>Loading scans…</div>
      ) : scansQ.isError ? (
        <div className="text-red-600">Failed to load scans</div>
      ) : (
        <div className="card">
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">Project</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Started</th>
                <th className="px-4 py-2">Finished</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scansQ.data?.map((s: ScanWithProject) => (
                <Fragment key={s.id}>
                  <tr className={s.status === "running" ? "bg-yellow-100" : ""}>
                    <td className="border px-4 py-2">
                      <Link to={`/projects/${s.project_id}`} className="underline">
                        {s.project_name}
                      </Link>
                    </td>
                    <td className="border px-4 py-2">{s.status}</td>
                    <td className="border px-4 py-2">
                      {new Date(s.started_at).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">
                      {s.finished_at
                        ? new Date(s.finished_at).toLocaleString()
                        : "-"}
                    </td>
                    <td className="border px-4 py-2 space-x-2">
                      <button
                        className="btn btn-sm"
                        onClick={() =>
                          setOpenLogId(openLogId === s.id ? null : s.id)
                        }
                      >
                        {openLogId === s.id ? "Hide Log" : "Log"}
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() =>
                          setOpenHostsId(openHostsId === s.id ? null : s.id)
                        }
                      >
                        {openHostsId === s.id ? "Hide Hosts" : "Hosts"}
                      </button>
                    </td>
                  </tr>
                  {openLogId === s.id && (
                    <tr>
                      <td colSpan={5}>
                        <LiveLog scanId={s.id} />
                      </td>
                    </tr>
                  )}
                  {openHostsId === s.id && (
                    <tr>
                      <td colSpan={5}>
                        <HostList scanId={s.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

