import { Routes, Route, Link } from "react-router-dom";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDashboardPage from "./pages/ProjectDashboardPage";
import NewProjectPage from "./pages/NewProjectPage";
import IPDetailsPage from "./pages/IPDetailsPage";
import NmapRunner from "./components/NmapRunner";
import DebugDashboardPage from "./pages/DebugDashboardPage";

export default function App() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          <Link to="/">NetScan Orchestrator</Link>
        </h1>
        <nav className="flex items-center gap-3">
          <Link className="btn" to="/quick-scan">
            Quick Scan
          </Link>
          <a
            className="btn"
            href="https://github.com/cornish337/NetScanOrchestrator-NG"
            target="_blank"
            rel="noreferrer"
          >
            Repo
          </a>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/new" element={<NewProjectPage />} />
        <Route path="/projects/:projectId" element={<ProjectDashboardPage />} />
        <Route path="/ip/:address" element={<IPDetailsPage />} />
        <Route path="/runner" element={<NmapRunner />} />
        <Route path="/quick-scan" element={<NmapRunner />} />
        <Route path="/debug" element={<DebugDashboardPage />} />
      </Routes>
    </div>
  );
}
