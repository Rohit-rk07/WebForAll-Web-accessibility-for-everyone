"""Unit tests for the anti-SSRF request guard used by the Playwright analyzer."""

import asyncio
import pytest
from analyzer.playwright_helper import (
    _hostname_is_public,
    _ip_is_global,
    hostname_is_suspicious,
    SSRFRequestGuard,
)


class FakeRequest:
    def __init__(self, url):
        self.url = url


class FakeRoute:
    def __init__(self, url):
        self.request = FakeRequest(url)
        self.aborted = None
        self.continued = False

    async def abort(self, error_code="blockedbyclient"):
        self.aborted = error_code

    async def continue_(self):
        self.continued = True


def run_guard(url):
    route = FakeRoute(url)
    guard = SSRFRequestGuard()
    asyncio.run(guard.handle(route))
    return route


class TestHostnameIsPublic:
    def test_loopback_is_private(self):
        assert _hostname_is_public("127.0.0.1") is False
        assert _hostname_is_public("localhost") is False

    def test_link_local_metadata_is_private(self):
        assert _hostname_is_public("169.254.169.254") is False

    def test_private_ranges_are_private(self):
        assert _hostname_is_public("10.0.0.1") is False
        assert _hostname_is_public("192.168.1.1") is False
        assert _hostname_is_public("172.16.0.1") is False
        assert _hostname_is_public("100.64.0.1") is False

    def test_reserved_and_unspecified_are_private(self):
        assert _hostname_is_public("0.0.0.0") is False
        assert _hostname_is_public("255.255.255.255") is False

    def test_global_ip_is_public(self):
        assert _hostname_is_public("8.8.8.8") is True

    def test_public_hostname_is_public(self):
        assert _hostname_is_public("example.com") is True


class TestHostnamePatternBlocklist:
    def test_internal_corporate_suffixes_are_blocked(self):
        for host in ("db.internal", "printer.local", "app.localhost", "box.lan",
                     "home.home.arpa", "server.corp", "files.intranet"):
            assert hostname_is_suspicious(host) is True, host
            assert _hostname_is_public(host) is False, host

    def test_well_known_metadata_hosts_are_blocked(self):
        for host in ("metadata", "metadata.google.internal", "localhost"):
            assert hostname_is_suspicious(host) is True, host

    def test_normal_public_hosts_are_not_suspicious(self):
        for host in ("example.com", "www.example.org", "sub.example.co.uk"):
            assert hostname_is_suspicious(host) is False, host


class TestIPv4MappedIPv6:
    def test_mapped_loopback_is_not_global(self):
        assert _ip_is_global("::ffff:127.0.0.1") is False

    def test_mapped_private_is_not_global(self):
        assert _ip_is_global("::ffff:10.0.0.1") is False
        assert _ip_is_global("::ffff:192.168.1.1") is False
        assert _ip_is_global("::ffff:169.254.169.254") is False

    def test_mapped_public_is_global(self):
        assert _ip_is_global("::ffff:8.8.8.8") is True

    def test_unmapped_global_v6_is_global(self):
        assert _ip_is_global("2606:4700:4700::1111") is True

    def test_guard_blocks_mapped_private_url(self):
        route = run_guard("http://[::ffff:127.0.0.1]:8080/admin")
        assert route.aborted is not None


class TestSSRFRequestGuard:
    def test_blocks_private_url(self):
        route = run_guard("http://127.0.0.1/admin")
        assert route.aborted is not None
        assert route.continued is False

    def test_blocks_cloud_metadata(self):
        route = run_guard("http://169.254.169.254/latest/meta-data/")
        assert route.aborted is not None

    def test_blocks_non_http_scheme(self):
        route = run_guard("file:///etc/passwd")
        assert route.aborted is not None

    def test_allows_public_url(self):
        route = run_guard("https://example.com")
        assert route.continued is True
        assert route.aborted is None

    def test_allows_data_url_documents(self):
        # Data URLs are intrinsic to HTML/file analysis and must pass through.
        route = run_guard("data:text/html;base64,PGh0bWw+")
        assert route.continued is True

    def test_blocks_redirect_target_to_private_host(self):
        # Simulates a public page redirecting to an internal destination.
        # Each follow-up request goes through the guard with its own URL.
        route = run_guard("http://localhost:3000/secret")
        assert route.aborted is not None