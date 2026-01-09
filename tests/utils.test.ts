import { describe, it, expect } from "vitest";
import { cn } from "../lib/utils";

describe("cn utility function", () => {
  it("should merge class names", () => {
    const result = cn("px-2", "py-1");
    expect(result).toBe("px-2 py-1");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class active-class");
  });

  it("should handle false conditionals", () => {
    const isActive = false;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class");
  });

  it("should merge conflicting Tailwind classes", () => {
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });

  it("should handle arrays of classes", () => {
    const result = cn(["px-2", "py-1"]);
    expect(result).toBe("px-2 py-1");
  });

  it("should handle objects with boolean values", () => {
    const result = cn({
      "text-red-500": true,
      "text-blue-500": false,
    });
    expect(result).toBe("text-red-500");
  });

  it("should handle empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should merge responsive classes correctly", () => {
    const result = cn("md:px-2", "md:px-4");
    expect(result).toBe("md:px-4");
  });

  it("should preserve different breakpoint classes", () => {
    const result = cn("sm:px-2", "md:px-4", "lg:px-6");
    expect(result).toBe("sm:px-2 md:px-4 lg:px-6");
  });
});
