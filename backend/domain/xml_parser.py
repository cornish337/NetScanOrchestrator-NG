import xml.etree.ElementTree as ET
from typing import List
from ..infra.models import Host, Port

def parse_nmap_xml(xml_content: str) -> List[Host]:
    """
    Parses Nmap XML output and returns a list of Host objects.
    These objects are not yet session-aware and must be added to a session
    to be persisted.
    """
    hosts: List[Host] = []
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError:
        # Handle empty or invalid XML
        return []

    for host_node in root.findall('host'):
        status_node = host_node.find('status')
        address_node = host_node.find('address')

        if status_node is None or address_node is None:
            continue

        host_status = status_node.get('state')
        if host_status != 'up':
            continue

        ip_address = address_node.get('addr')

        hostname_node = host_node.find('hostnames/hostname')
        hostname = hostname_node.get('name') if hostname_node is not None else None

        host = Host(
            address=ip_address,
            hostname=hostname,
            status=host_status,
            ports=[]
        )

        for port_node in host_node.findall('ports/port'):
            state_node = port_node.find('state')
            if state_node is None or state_node.get('state') != 'open':
                continue

            port_id = port_node.get('portid')
            protocol = port_node.get('protocol')
            port_state = state_node.get('state')

            service_node = port_node.find('service')
            service_name = service_node.get('name') if service_node is not None else None
            service_product = service_node.get('product') if service_node is not None else None
            service_version = service_node.get('version') if service_node is not None else None

            port = Port(
                port_number=int(port_id),
                protocol=protocol,
                state=port_state,
                service_name=service_name,
                service_product=service_product,
                service_version=service_version,
            )
            host.ports.append(port)

        if host.ports:
            hosts.append(host)

    return hosts
