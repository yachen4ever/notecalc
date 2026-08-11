import { describe, it, expect } from "vitest";
import { englishPercentRule } from "../composables/rules/englishPercent";

describe("V2 - 英文百分比规则 (englishPercent)", () => {
  // === X% off Y ===
  describe("X% off Y", () => {
    it("10% off 200", () => {
      expect(englishPercentRule.match("10% off 200")?.result).toBeCloseTo(180);
    });

    it("25% off 80", () => {
      expect(englishPercentRule.match("25% off 80")?.result).toBeCloseTo(60);
    });

    it("大小写不敏感", () => {
      expect(englishPercentRule.match("10% OFF 200")?.result).toBeCloseTo(180);
    });
  });

  // === Y with X% off ===
  describe("Y with X% off", () => {
    it("200 with 10% off", () => {
      expect(englishPercentRule.match("200 with 10% off")?.result).toBeCloseTo(180);
    });

    it("100 with 20% off", () => {
      expect(englishPercentRule.match("100 with 20% off")?.result).toBeCloseTo(80);
    });
  });

  // === X% of Y ===
  describe("X% of Y", () => {
    it("10% of 200", () => {
      expect(englishPercentRule.match("10% of 200")?.result).toBeCloseTo(20);
    });

    it("50% of 100", () => {
      expect(englishPercentRule.match("50% of 100")?.result).toBeCloseTo(50);
    });

    it("大小写不敏感", () => {
      expect(englishPercentRule.match("10% OF 200")?.result).toBeCloseTo(20);
    });
  });

  // === Y + X% / Y - X% ===
  describe("Y +/- X%", () => {
    it("200 + 10%", () => {
      expect(englishPercentRule.match("200 + 10%")?.result).toBeCloseTo(220);
    });

    it("200 - 10%", () => {
      expect(englishPercentRule.match("200 - 10%")?.result).toBeCloseTo(180);
    });

    it("1000 + 5%", () => {
      expect(englishPercentRule.match("1000 + 5%")?.result).toBeCloseTo(1050);
    });

    it("1000 - 15%", () => {
      expect(englishPercentRule.match("1000 - 15%")?.result).toBeCloseTo(850);
    });
  });

  // === 不匹配 ===
  describe("不匹配", () => {
    it("无百分比关键词", () => {
      expect(englishPercentRule.match("200")).toBeNull();
      expect(englishPercentRule.match("hello")).toBeNull();
    });
  });
});
