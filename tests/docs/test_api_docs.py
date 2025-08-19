from __future__ import annotations

from pathlib import Path
import re
import sys

# Ensure repository root is on sys.path so "backend" is importable
sys.path.append(str(Path(__file__).resolve().parents[2]))

from backend.main import app


HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
pattern = re.compile(r"`(" + "|".join(HTTP_METHODS) + r") (/[^`]+)`")

def extract_doc_paths(md_path: Path) -> set[str]:
    text = md_path.read_text()
    if "## WebSocket API" in text:
        text = text.split("## WebSocket API")[0]
    paths: set[str] = set()
    for method, route in pattern.findall(text):
        if not route.startswith("/"):
            route = "/" + route
        if not route.startswith("/api"):
            route = "/api" + route
        paths.add(route)
    return paths

def test_api_docs_cover_openapi_paths():
    schema = app.openapi()
    openapi_paths = set(schema.get("paths", {}).keys())
    doc_paths = extract_doc_paths(Path("docs/api.md"))
    missing_from_docs = openapi_paths - doc_paths
    nonexistent_in_api = doc_paths - openapi_paths
    assert not missing_from_docs and not nonexistent_in_api, (
        f"Missing from docs: {sorted(missing_from_docs)}; "
        f"Nonexistent in API: {sorted(nonexistent_in_api)}"
    )
