export interface Project {
  id: number;
  name: string;
  description?: string;
}

export interface StartScanReq {
  project_id: number;
  nmap_flags: string[];
  targets: string[];
  chunk_size: number;
  concurrency: number;
}

export interface StartScanRes {
  scan_id: number;
  status: string;
}

export interface ConnectedEvent {
  event: "connected";
  scan_id: number;
}

export interface LineEvent {
  event: "line";
  batch_id: number;
  line: string;
}

export interface BatchStartEvent {
  event: "batch_start";
  batch_id: number;
  targets: string[];
}

export interface BatchCompleteEvent {
  event: "batch_complete";
  batch_id: number;
  summary: {
    hosts_up: number;
    open_ports: number;
  };
}

export interface ScanCompleteEvent {
  event: "scan_complete";
  scan_id: number;
}

export type WSEvent =
  | ConnectedEvent
  | LineEvent
  | BatchStartEvent
  | BatchCompleteEvent
  | ScanCompleteEvent;
