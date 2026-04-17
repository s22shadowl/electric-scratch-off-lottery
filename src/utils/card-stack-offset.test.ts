import { describe, it, expect } from "vitest";
import { cardStackOffset } from "./card-stack-offset";

describe("cardStackOffset", () => {
  it("should return offsetY and rotation", () => {
    const result = cardStackOffset("card-0");
    expect(result).toHaveProperty("offsetY");
    expect(result).toHaveProperty("rotation");
  });

  it("should be deterministic — same id returns same values", () => {
    const a = cardStackOffset("card-1");
    const b = cardStackOffset("card-1");
    expect(a).toEqual(b);
  });

  it("should produce different values for different ids", () => {
    const a = cardStackOffset("card-0");
    const b = cardStackOffset("card-1");
    const c = cardStackOffset("card-2");
    const allSame =
      a.offsetY === b.offsetY &&
      b.offsetY === c.offsetY &&
      a.rotation === b.rotation &&
      b.rotation === c.rotation;
    expect(allSame).toBe(false);
  });

  it("offsetY should be within ±6px range", () => {
    for (let i = 0; i < 20; i++) {
      const { offsetY } = cardStackOffset(`card-${i}`);
      expect(offsetY).toBeGreaterThanOrEqual(-6);
      expect(offsetY).toBeLessThanOrEqual(6);
    }
  });

  it("rotation should be within ±2.5 degrees", () => {
    for (let i = 0; i < 20; i++) {
      const { rotation } = cardStackOffset(`card-${i}`);
      expect(rotation).toBeGreaterThanOrEqual(-2.5);
      expect(rotation).toBeLessThanOrEqual(2.5);
    }
  });
});
