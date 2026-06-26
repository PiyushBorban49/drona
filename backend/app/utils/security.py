import socket
import ipaddress
from urllib.parse import urlparse

def is_safe_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ["http", "https"]:
            return False
        
        hostname = parsed.hostname
        if not hostname:
            return False
            
        # Resolve hostname to IP
        ip_addr = socket.gethostbyname(hostname)
        ip = ipaddress.ip_address(ip_addr)
        
        # Check if IP is private or loopback
        if ip.is_link_local or ip.is_loopback or ip.is_multicast or ip.is_private or ip.is_reserved:
            return False
            
        return True
    except Exception:
        return False
