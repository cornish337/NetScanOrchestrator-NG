import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listProjects, listAllScans, type Project, type Scan } from "../lib/api";

export default function Projects() {
  const projectsQ = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
    staleTime: 5_000,
  });

  const scansQ = useQuery({
    queryKey: ["all-scans"],
    queryFn: listAllScans,
    staleTime: 5_000,
  });

  const scanData = scansQ.data?.scans ?? [];
  const statusCounts = scanData.reduce(
    (acc, s: Scan) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link to="/projects/new" className="btn">
          New Project
        </Link>
      </header>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Scan Summary</h2>
        {scansQ.isLoading ? (
          <div>Loading scans…</div>
        ) : scansQ.isError ? (
          <div className="text-red-600">Failed to load scans</div>
        ) : (
          <div className="flex gap-4 flex-wrap">
            <div>Total: {scanData.length}</div>
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status}>
                {status}: {count}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card space-y-4">
        {projectsQ.isLoading ? (
          <div>Loading projects…</div>
        ) : projectsQ.isError ? (
          <div className="text-red-600">Failed to load projects</div>
        ) : (
          <>
          {!projectsQ.data || projectsQ.data.length === 0 ? (
              <div className="text-slate-500">No projects yet — create one.</div>
            ) : (
              <table className="table-auto w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projectsQ.data.map((p: Project) => (
                    <tr key={p.id}>
                      <td className="border px-4 py-2">{p.name}</td>
                      <td className="border px-4 py-2">{p.description}</td>
                      <td className="border px-4 py-2">
                        <Link to={`/projects/${p.id}`} className="btn">
                          View
                        </Link>
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
