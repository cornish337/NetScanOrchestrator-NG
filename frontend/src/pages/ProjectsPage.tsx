import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listProjects, type Project } from "../lib/api";

export default function Projects() {
  const projectsQ = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
    staleTime: 5_000,
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link to="/projects/new" className="btn">
          New Project
        </Link>
      </header>

      <section className="card space-y-4">
        {projectsQ.isLoading ? (
          <div>Loading projects…</div>
        ) : projectsQ.isError ? (
          <div className="text-red-600">Failed to load projects</div>
        ) : (
          <>
            {projectsQ.data.length === 0 ? (
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
