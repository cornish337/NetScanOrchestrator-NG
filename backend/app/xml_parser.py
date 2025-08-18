from xml.etree import ElementTree as ET
from pathlib import Path
from typing import Dict, Any


# Minimal parser for Nmap -oX outputs; extend as needed

def parse_oX(xml_path: Path) -> Dict[str, Any]:
    root = ET.parse(xml_path).getroot()
    summary = {"hosts": []}
    for host in root.findall('host'):
        addresses = [a.get('addr') for a in host.findall('address') if a.get('addr')]
        ports = []
        for p in host.findall('.//port'):
            ports.append({
                'portid': p.get('portid'),
                'protocol': p.get('protocol'),
                'state': (p.find('state') or {}).get('state') if p.find('state') is not None else None,
                'service': (p.find('service') or {}).get('name') if p.find('service') is not None else None,
            })
        summary["hosts"].append({"addresses": addresses, "ports": ports})
    return summary
