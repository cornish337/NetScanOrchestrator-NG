from __future__ import annotations
import asyncio
from pathlib import Path
from datetime import datetime
from typing import AsyncIterator, Sequence

# Streams Nmap stdout lines as they arrive and writes files.
# You can attach a WebSocket and forward lines to clients.
async def run_nmap_batch(
    batch_id: int,
    targets: Sequence[str],
    nmap_flags: Sequence[str],
    out_dir: Path,
) -> AsyncIterator[str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    xml_path = out_dir / f"batch_{batch_id}.xml"
    stdout_path = out_dir / f"batch_{batch_id}.stdout.log"
    stderr_path = out_dir / f"batch_{batch_id}.stderr.log"

    # Build the command safely (no shell!)
    cmd = ["nmap", *nmap_flags, "-oX", str(xml_path), *targets]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    assert proc.stdout and proc.stderr

    # Read stdout lines as they come
    with stdout_path.open("wb") as out_f, stderr_path.open("wb") as err_f:
        async def pipe(reader, sink, tag: str):
            while True:
                line = await reader.readline()
                if not line:
                    break
                sink.write(line)
                if tag == "stdout":
                    yield_line = line.decode(errors="ignore").rstrip("\n")
                    yield yield_line

        # Consume stdout concurrently with stderr; stream stdout lines to caller.
        async def stream_stdout():
            async for ln in pipe(proc.stdout, out_f, "stdout"):
                yield ln

        async def drain_stderr():
            # we don't stream stderr outwards, just save it
            async for _ in pipe(proc.stderr, err_f, "stderr"):
                pass

        # Run both; yield stdout lines as they are produced.
        stderr_task = asyncio.create_task(drain_stderr())
        async for ln in stream_stdout():
            yield ln
        await stderr_task

    rc = await proc.wait()
    if rc != 0:
        yield f"[runner] nmap exited with code {rc}"
