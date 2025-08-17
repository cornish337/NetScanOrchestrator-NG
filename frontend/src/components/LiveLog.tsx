import { useEffect, useRef, useState } from "react";
import { wsUrl } from "../lib/api";
import type { WSEvent } from "../lib/types";

export default function LiveLog({ scanId }: { scanId: number }) {
  const [lines, setLines] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ws = new WebSocket(wsUrl(`/ws/scans/${scanId}`));
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const msg: WSEvent = JSON.parse(ev.data);
        if (msg.event === "line") {
          setLines((prev) => [...prev, `[batch ${msg.batch_id}] ${msg.line}`].slice(-2000));
        } else if (msg.event === "batch_start") {
          setLines((p) => [...p, `▶ batch ${msg.batch_id} started (${msg.targets.length} targets)`]);
        } else if (msg.event === "batch_complete") {
          setLines((p) => [
            ...p,
            `✔ batch ${msg.batch_id} complete — hosts_up=${msg.summary.hosts_up}, open_ports=${msg.summary.open_ports}`,
          ]);
        } else if (msg.event === "scan_complete") {
          setLines((p) => [...p, `🏁 scan ${msg.scan_id} complete`]);
        } else if (msg.event === "connected") {
          setLines((p) => [...p, `connected to scan ${msg.scan_id}`]);
        }
      } catch {
        setLines((prev) => [...prev, ev.data]);
      }
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    ws.onerror = () => setLines((p) => [...p, "⚠ websocket error"]);
    ws.onclose = () => setLines((p) => [...p, "ℹ disconnected"]);

    return () => ws.close();
  }, [scanId]);

  return (
    <div className="card max-h-[40vh] overflow-auto text-sm font-mono leading-tight">
      {lines.map((l, i) => (
        <div key={i} className="whitespace-pre-wrap">{l}</div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
