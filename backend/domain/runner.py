from __future__ import annotations
import asyncio
from pathlib import Path
from typing import AsyncIterator, Sequence

from ..app.settings import settings

async def run_nmap_batch(
    batch_id: int,
    targets: Sequence[str],
    nmap_flags: Sequence[str],
    out_dir: Path | None = None,
    nmap_path: str | None = None,
) -> AsyncIterator[str]:
    out_dir = out_dir or settings.output_dir
    nmap_path = nmap_path or settings.nmap_path
    out_dir.mkdir(parents=True, exist_ok=True)
    xml_path = out_dir / f"batch_{batch_id}.xml"
    stdout_path = out_dir / f"batch_{batch_id}.stdout.log"
    stderr_path = out_dir / f"batch_{batch_id}.stderr.log"

    cmd = [nmap_path, *nmap_flags, "-oX", str(xml_path), *targets]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    assert proc.stdout and proc.stderr

    try:
        with stdout_path.open("wb") as out_f, stderr_path.open("wb") as err_f:
            async def pipe(reader, sink, forward_stdout: bool):
                while True:
                    line = await reader.readline()
                    if not line:
                        break
                    sink.write(line)
                    if forward_stdout:
                        yield line.decode(errors="ignore").rstrip("\n")

            async def stream_stdout():
                async for ln in pipe(proc.stdout, out_f, True):
                    yield ln

            async def drain_stderr():
                async for _ in pipe(proc.stderr, err_f, False):
                    pass

            stderr_task = asyncio.create_task(drain_stderr())
            async for ln in stream_stdout():
                yield ln
            await stderr_task

        rc = await proc.wait()
        if rc != 0:
            yield f"[runner] nmap exited with code {rc}"
    except asyncio.CancelledError:
        # terminate underlying process on cancellation
        try:
            proc.terminate()
            await asyncio.wait_for(proc.wait(), timeout=5)
        except Exception:
            proc.kill()
        raise
