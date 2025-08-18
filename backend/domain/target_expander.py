from netaddr import IPNetwork, IPAddress, AddrFormatError
from typing import List

def expand_targets(targets: List[str]) -> List[str]:
    expanded_targets = []
    for target in targets:
        try:
            if "/" in target:
                network = IPNetwork(target)
                for ip in network:
                    expanded_targets.append(str(ip))
            else:
                ip = IPAddress(target)
                expanded_targets.append(str(ip))
        except (AddrFormatError, ValueError):
            # For now, we'll just ignore invalid targets.
            # In the future, we might want to return an error.
            pass
    return expanded_targets
