package com.ssn.webcrawler.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Locale;
import java.util.Set;

@Component
public class UrlSecurityValidator {

    private static final Logger log = LoggerFactory.getLogger(UrlSecurityValidator.class);

    private static final Set<String> BLOCKED_HOST_PREFIXES_OR_EXACT = Set.of(
            "localhost",
            "metadata.google.internal",
            "metadata.internal",
            "instance-data"
    );

    public void validateUrl(String urlString) {
        validateUrl(urlString, DnsResolver.SYSTEM);
    }

    public void validateUrl(String urlString, DnsResolver dnsResolver) {
        if (urlString == null || urlString.trim().isEmpty()) {
            throw new IllegalArgumentException("Target URL cannot be empty");
        }

        String trimmed = urlString.trim();

        // 1. Basic structural parsing via java.net.URI
        URI uri;
        try {
            uri = new URI(trimmed);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid URL syntax: " + e.getMessage());
        }

        // Scheme check: ONLY http and https allowed
        String scheme = uri.getScheme();
        if (scheme == null) {
            throw new IllegalArgumentException("URL scheme is missing. Only http and https are allowed.");
        }
        scheme = scheme.toLowerCase(Locale.ROOT);
        if (!scheme.equals("http") && !scheme.equals("https")) {
            throw new IllegalArgumentException("Forbidden URL scheme '" + scheme + "'. Only http and https are allowed.");
        }

        // Reject UserInfo (e.g. http://user:pass@evil.com)
        if (uri.getUserInfo() != null && !uri.getUserInfo().isEmpty()) {
            throw new IllegalArgumentException("URLs with userinfo credentials are not permitted.");
        }

        // Extract host
        String host = uri.getHost();
        if (host == null || host.trim().isEmpty()) {
            throw new IllegalArgumentException("URL must contain a valid hostname.");
        }
        host = host.trim().toLowerCase(Locale.ROOT);

        // Strip IPv6 square brackets if present
        if (host.startsWith("[") && host.endsWith("]")) {
            host = host.substring(1, host.length() - 1);
        }

        // Check well-known internal/cloud metadata names
        if (isBlockedHostName(host)) {
            throw new IllegalArgumentException("Access to internal/metadata service is blocked: " + host);
        }

        // 2. DNS Resolution and IP Validation (prevent DNS rebinding)
        InetAddress[] addresses;
        try {
            addresses = dnsResolver.resolve(host);
        } catch (UnknownHostException e) {
            if (host.contains("internal") || host.contains("local") || host.contains("metadata")) {
                throw new IllegalArgumentException("Access to internal/metadata service is blocked: " + host);
            }
            throw new IllegalArgumentException("Host cannot be resolved: " + host);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to resolve host: " + e.getMessage());
        }

        if (addresses == null || addresses.length == 0) {
            throw new IllegalArgumentException("No IP addresses found for host: " + host);
        }

        // Validate EVERY returned A/AAAA record
        for (InetAddress addr : addresses) {
            if (isIpBlocked(addr)) {
                log.warn("SSRF blocked: host {} resolved to private/blocked IP {}", host, addr.getHostAddress());
                throw new IllegalArgumentException("Access to internal or private IP address is prohibited: " + addr.getHostAddress());
            }
        }
    }

    public boolean isIpBlocked(InetAddress addr) {
        if (addr == null) {
            return true;
        }

        // Standard java checks
        if (addr.isLoopbackAddress() || addr.isAnyLocalAddress() || addr.isLinkLocalAddress()
                || addr.isSiteLocalAddress() || addr.isMulticastAddress()) {
            return true;
        }

        byte[] raw = addr.getAddress();

        // IPv4 Check
        if (raw.length == 4) {
            return isIpv4Blocked(raw);
        }

        // IPv6 Check
        if (raw.length == 16) {
            // Check for IPv4-mapped IPv6 (::ffff:w.x.y.z)
            if (isIpv4MappedIpv6(raw)) {
                byte[] ipv4 = new byte[]{raw[12], raw[13], raw[14], raw[15]};
                return isIpv4Blocked(ipv4);
            }

            // Check for IPv4-compatible IPv6 (::w.x.y.z)
            if (isIpv4CompatibleIpv6(raw)) {
                byte[] ipv4 = new byte[]{raw[12], raw[13], raw[14], raw[15]};
                return isIpv4Blocked(ipv4);
            }

            // Check for 6to4 (2002::/16)
            if ((raw[0] & 0xFF) == 0x20 && (raw[1] & 0xFF) == 0x02) {
                byte[] ipv4 = new byte[]{raw[2], raw[3], raw[4], raw[5]};
                return isIpv4Blocked(ipv4);
            }

            // IPv6 Unique Local Address (fc00::/7 -> fc00:: - fdff::)
            int firstByte = raw[0] & 0xFF;
            if ((firstByte & 0xFE) == 0xFC) {
                return true;
            }

            // IPv6 Link-Local (fe80::/10)
            if (firstByte == 0xFE && (raw[1] & 0xC0) == 0x80) {
                return true;
            }

            // IPv6 Loopback (::1)
            if (isIpv6Loopback(raw)) {
                return true;
            }

            // IPv6 Multicast (ff00::/8)
            if (firstByte == 0xFF) {
                return true;
            }
        }

        return false;
    }

    private boolean isIpv4Blocked(byte[] raw) {
        int b0 = raw[0] & 0xFF;
        int b1 = raw[1] & 0xFF;
        int b2 = raw[2] & 0xFF;
        int b3 = raw[3] & 0xFF;

        // 0.0.0.0/8 (Current network / default)
        if (b0 == 0) return true;

        // 10.0.0.0/8 (Private network)
        if (b0 == 10) return true;

        // 100.64.0.0/10 (Shared Address Space / CGNAT)
        if (b0 == 100 && (b1 >= 64 && b1 <= 127)) return true;

        // 127.0.0.0/8 (Loopback)
        if (b0 == 127) return true;

        // 169.254.0.0/16 (Link Local & Cloud Metadata)
        if (b0 == 169 && b1 == 254) return true;

        // 172.16.0.0/12 (Private network)
        if (b0 == 172 && (b1 >= 16 && b1 <= 31)) return true;

        // 192.0.0.0/24 (IETF Protocol Assignments)
        if (b0 == 192 && b1 == 0 && b2 == 0) return true;

        // 192.0.2.0/24 (TEST-NET-1)
        if (b0 == 192 && b1 == 0 && b2 == 2) return true;

        // 192.168.0.0/16 (Private network)
        if (b0 == 192 && b1 == 168) return true;

        // 198.18.0.0/15 (Network benchmark tests)
        if (b0 == 198 && (b1 == 18 || b1 == 19)) return true;

        // 198.51.100.0/24 (TEST-NET-2)
        if (b0 == 198 && b1 == 51 && b2 == 100) return true;

        // 203.0.113.0/24 (TEST-NET-3)
        if (b0 == 203 && b1 == 0 && b2 == 113) return true;

        // 224.0.0.0/4 (Multicast)
        if (b0 >= 224 && b0 <= 239) return true;

        // 240.0.0.0/4 (Reserved for future use)
        if (b0 >= 240 && b0 <= 254) return true;

        // 255.255.255.255 (Broadcast)
        if (b0 == 255 && b1 == 255 && b2 == 255 && b3 == 255) return true;

        return false;
    }

    private boolean isIpv4MappedIpv6(byte[] raw) {
        for (int i = 0; i < 10; i++) {
            if (raw[i] != 0) return false;
        }
        return (raw[10] & 0xFF) == 0xFF && (raw[11] & 0xFF) == 0xFF;
    }

    private boolean isIpv4CompatibleIpv6(byte[] raw) {
        for (int i = 0; i < 12; i++) {
            if (raw[i] != 0) return false;
        }
        return !(raw[12] == 0 && raw[13] == 0 && raw[14] == 0 && raw[15] == 1); // Not ::1
    }

    private boolean isIpv6Loopback(byte[] raw) {
        for (int i = 0; i < 15; i++) {
            if (raw[i] != 0) return false;
        }
        return raw[15] == 1;
    }

    private boolean isBlockedHostName(String host) {
        if (BLOCKED_HOST_PREFIXES_OR_EXACT.contains(host)) {
            return true;
        }
        if (host.endsWith(".internal") || host.endsWith(".local") || host.endsWith(".localhost")) {
            return true;
        }
        return false;
    }
}
