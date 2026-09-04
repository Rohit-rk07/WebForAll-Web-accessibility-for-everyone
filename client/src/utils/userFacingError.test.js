import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getUserFacingError, isOffline } from "./userFacingError";

describe("isOffline", () => {
  it("returns true when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    expect(isOffline()).toBe(true);
  });

  it("returns false when navigator.onLine is true", () => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    expect(isOffline()).toBe(false);
  });
});

describe("getUserFacingError", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns offline hint when offline", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    expect(getUserFacingError({ status: 500 })).toContain("offline");
  });

  it("handles missing error with fallback", () => {
    expect(getUserFacingError(null)).toBe("Something went wrong. Please try again.");
  });

  it("maps abort errors to a timeout hint", () => {
    const error = new Error("aborted");
    error.name = "AbortError";
    expect(getUserFacingError(error)).toContain("too long");
  });

  it("maps common status codes to friendly messages", () => {
    expect(getUserFacingError({ status: 401 })).toContain("session expired");
    expect(getUserFacingError({ status: 403 })).toContain("permission");
    expect(getUserFacingError({ status: 404 })).toContain("could not find");
    expect(getUserFacingError({ status: 429 })).toContain("Too many requests");
    expect(getUserFacingError({ status: 500 })).toContain("server had a problem");
  });

  it("uses the server detail message when present", () => {
    const error = { status: 422, response: { data: { detail: "Email already registered" } } };
    expect(getUserFacingError(error)).toBe("Email already registered");
  });

  it("maps fetch failure messages to the network hint", () => {
    expect(getUserFacingError(new Error("Failed to fetch"))).toContain(
      "Unable to reach the server",
    );
  });

  it("passes through a meaningful message otherwise", () => {
    expect(getUserFacingError(new Error("File must be UTF-8 encoded"))).toBe(
      "File must be UTF-8 encoded",
    );
  });

  it("falls back for generic request-failed messages", () => {
    expect(getUserFacingError(new Error("Request failed (500)"))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});