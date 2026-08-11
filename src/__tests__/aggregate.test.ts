import { describe, it, expect } from "vitest";
import { aggregateRule } from "../composables/rules/aggregate";

describe("V4 - 聚合函数规则 (aggregate)", () => {
  // === 平均 ===
  describe("平均", () => {
    it("平均 100 200 300", () => {
      expect(aggregateRule.match("平均 100 200 300")?.result).toBe(200);
    });

    it("平均值", () => {
      expect(aggregateRule.match("平均值 10 20 30 40")?.result).toBe(25);
    });

    it("avg", () => {
      expect(aggregateRule.match("avg 10 20 30")?.result).toBe(20);
    });

    it("average", () => {
      expect(aggregateRule.match("average 10 20")?.result).toBe(15);
    });
  });

  // === 最大 ===
  describe("最大", () => {
    it("最大 34 56 78", () => {
      expect(aggregateRule.match("最大 34 56 78")?.result).toBe(78);
    });

    it("max", () => {
      expect(aggregateRule.match("max 100 200 50")?.result).toBe(200);
    });
  });

  // === 最小 ===
  describe("最小", () => {
    it("最小 34 56 78", () => {
      expect(aggregateRule.match("最小 34 56 78")?.result).toBe(34);
    });

    it("min", () => {
      expect(aggregateRule.match("min 100 200 50")?.result).toBe(50);
    });
  });

  // === 总和 ===
  describe("总和", () => {
    it("总和 10 20 30", () => {
      expect(aggregateRule.match("总和 10 20 30")?.result).toBe(60);
    });

    it("sum", () => {
      expect(aggregateRule.match("sum 10 20 30")?.result).toBe(60);
    });

    it("total", () => {
      expect(aggregateRule.match("total 100 200")?.result).toBe(300);
    });
  });

  // === 边界 ===
  describe("边界", () => {
    it("赋值语句不匹配", () => {
      expect(aggregateRule.match("平均 = 100")).toBeNull();
    });

    it("无数字不匹配", () => {
      expect(aggregateRule.match("平均")).toBeNull();
    });

    it("普通文本不匹配", () => {
      expect(aggregateRule.match("100 + 200")).toBeNull();
    });
  });
});
