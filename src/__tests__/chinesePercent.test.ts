import { describe, it, expect } from "vitest";
import { chinesePercentRule } from "../composables/rules/chinesePercent";

describe("V2 - 中文百分比规则 (chinesePercent)", () => {
  // === X占Y的百分比 ===
  describe("X占Y的百分比", () => {
    it("120占800的百分比", () => {
      expect(chinesePercentRule.match("120占800的百分比")?.result).toBeCloseTo(15);
    });

    it("120是800的百分之几", () => {
      expect(chinesePercentRule.match("120是800的百分之几")?.result).toBeCloseTo(15);
    });

    it("50占200的百分比", () => {
      expect(chinesePercentRule.match("50占200的百分比")?.result).toBeCloseTo(25);
    });
  });

  // === X的百分之Y ===
  describe("X的百分之Y", () => {
    it("120的百分之15", () => {
      expect(chinesePercentRule.match("120的百分之15")?.result).toBeCloseTo(18);
    });

    it("200的百分之25", () => {
      expect(chinesePercentRule.match("200的百分之25")?.result).toBeCloseTo(50);
    });
  });

  // === X的Y% ===
  describe("X的Y%", () => {
    it("120的15%", () => {
      expect(chinesePercentRule.match("120的15%")?.result).toBeCloseTo(18);
    });

    it("带空格 120 的 15%", () => {
      expect(chinesePercentRule.match("120 的 15%")?.result).toBeCloseTo(18);
    });

    it("200的50%", () => {
      expect(chinesePercentRule.match("200的50%")?.result).toBeCloseTo(100);
    });
  });

  // === 边界 ===
  describe("边界情况", () => {
    it("除零保护", () => {
      expect(chinesePercentRule.match("120占0的百分比")).toBeNull();
    });

    it("不匹配", () => {
      expect(chinesePercentRule.match("hello")).toBeNull();
      expect(chinesePercentRule.match("100")).toBeNull();
    });
  });
});
