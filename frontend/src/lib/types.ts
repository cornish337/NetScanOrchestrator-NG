export type WSEvent =
  | { event: "line"; batch_id: number; line: string }
  | { event: "batch_start"; batch_id: number; targets: string[] }
  | { event: "batch_complete"; batch_id: number; summary: { hosts_up: number; open_ports: number } }
  | { event: "scan_complete"; scan_id: number }
  | { event: "connected"; scan_id: number };
