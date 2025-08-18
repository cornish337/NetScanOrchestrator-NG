import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createProject } from "../lib/api";

export default function NewProjectPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const createProjectM = useMutation({
    mutationFn: (input: { name: string; description?: string }) =>
      createProject(input.name, input.description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Project</h1>
      </header>

      <section className="card space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label">Project Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <input
              className="input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="btn"
            disabled={createProjectM.isPending || !name.trim()}
            onClick={() => {
              if (!name.trim()) return;
              createProjectM.mutate({
                name: name.trim(),
                description: desc.trim() || undefined,
              });
            }}
          >
            {createProjectM.isPending ? "Creating..." : "Create Project"}
          </button>
          {createProjectM.isError && (
            <div className="text-red-600">Failed to create project</div>
          )}
        </div>
      </section>
    </div>
  );
}
