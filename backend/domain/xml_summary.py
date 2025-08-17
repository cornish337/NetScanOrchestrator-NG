from __future__ import annotations
from pathlib import Path
import xml.etree.ElementTree as ET

# Returns {hosts_up: int, open_ports: int}
# This is deliberately tiny; replace with a full parse later.

def parse_xml_summary(xml_path: Path) -> dict:
    if not xml_path.exists():
        return {"hosts_up": 0, "open_ports": 0}
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        hosts_up = 0
        open_ports = 0
        for host in root.findall("host"):
            status = host.find("status")
            if status is not None and status.get("state") == "up":
                hosts_up += 1
            ports = host.find("ports")
            if ports is not None:
                for p in ports.findall("port"):
                    st = p.find("state")
                    if st is not None and st.get("state") == "open":
                        open_ports += 1
        return {"hosts_up": hosts_up, "open_ports": open_ports}
    except Exception:
        return {"hosts_up": 0, "open_ports": 0}
