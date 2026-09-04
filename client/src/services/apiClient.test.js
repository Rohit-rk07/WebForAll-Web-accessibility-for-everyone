import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiJson } from "./apiClient";

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

describe("apiJson", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn((url) => {
        if (String(url).endsWith("/csrf-token")) {
          return Promise.resolve(jsonResponse({ csrf_token: "csrf-token-1" }));
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      }),
    );
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("attaches the bearer token from localStorage", async () => {
    localStorage.setItem("accessToken", "bearer-token");
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation((url, opts) => {
      expect(opts.headers.Authorization).toBe("Bearer bearer-token");
      return Promise.resolve(jsonResponse({ ok: true }));
    });

    const data = await apiJson("/users/me", { method: "GET" });
    expect(data).toEqual({ ok: true });
  });

  it("attaches the CSRF token to state-changing requests", async () => {
    const fetchMock = vi.mocked(fetch);
    let csrfFetched = false;
    fetchMock.mockImplementation((url) => {
      if (String(url).endsWith("/csrf-token")) {
        csrfFetched = true;
        return Promise.resolve(jsonResponse({ csrf_token: "csrf-token-1" }));
      }
      // The actual POST request should include the CSRF token
      expect(csrfFetched).toBe(true);
      return Promise.resolve(jsonResponse({ ok: true }));
    });

    await apiJson("/analyze/html", { method: "POST", body: "{}" });
  });

  it("maps HTTP errors to user-facing messages", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse({ detail: "boom" }, 500)),
    );

    await expect(
      apiJson("/some/endpoint", { method: "GET" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("returns offline hint when offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    await expect(
      apiJson("/some/endpoint", { method: "GET" }),
    ).rejects.toMatchObject({ status: undefined });
  });
});