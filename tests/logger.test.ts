import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger } from "../lib/logger";

describe("Logger", () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  describe("createLogger", () => {
    it("should create a logger with a prefix", () => {
      const logger = createLogger({ prefix: "test" });
      logger.info("test message");
      expect(consoleInfoSpy).toHaveBeenCalled();
      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain("[test]");
      expect(call).toContain("test message");
    });

    it("should include timestamp in logs", () => {
      const logger = createLogger({ prefix: "test" });
      logger.info("test message");
      const call = consoleInfoSpy.mock.calls[0][0];
      // Timestamp format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should format log levels correctly", () => {
      const logger = createLogger({ prefix: "test" });
      logger.info("info message");
      expect(consoleInfoSpy.mock.calls[0][0]).toContain("INFO");
    });
  });

  describe("log levels", () => {
    it("should have debug level", () => {
      vi.stubEnv("LOG_LEVEL", "debug");
      const logger = createLogger({ prefix: "test" });
      logger.debug("debug message");
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it("should have warn level", () => {
      const logger = createLogger({ prefix: "test" });
      logger.warn("warn message");
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should have error level", () => {
      const logger = createLogger({ prefix: "test" });
      logger.error("error message");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("additional args", () => {
    it("should pass additional arguments to console", () => {
      const logger = createLogger({ prefix: "test" });
      const testData = { key: "value", number: 42 };
      logger.info("data", testData);
      expect(consoleInfoSpy).toHaveBeenCalled();
      // The additional args are passed as the second argument
      expect(consoleInfoSpy.mock.calls[0][1]).toEqual(testData);
    });

    it("should handle nested objects", () => {
      const logger = createLogger({ prefix: "test" });
      const testData = { outer: { inner: "value" } };
      logger.info("nested", testData);
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleInfoSpy.mock.calls[0][1]).toEqual(testData);
    });
  });
});
