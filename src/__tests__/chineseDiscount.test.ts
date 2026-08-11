import { describe, it, expect } from "vitest";
import { chineseDiscountRule } from "../composables/rules/chineseDiscount";

describe("V2 - 中文折扣规则 (chineseDiscount)", () => {
  // === 打折 ===
  describe("打折", () => {
    it("打8折（带金额）", () => {
      expect(chineseDiscountRule.match("100打8折")?.result).toBeCloseTo(80);
      expect(chineseDiscountRule.match("100 打 8 折")?.result).toBeCloseTo(80);
    });

    it("8折（带金额）", () => {
      expect(chineseDiscountRule.match("200 8折")?.result).toBeCloseTo(160);
    });

    it("9.5折", () => {
      expect(chineseDiscountRule.match("1000 9.5折")?.result).toBeCloseTo(950);
    });

    it("8折（无金额，返回折扣率）", () => {
      expect(chineseDiscountRule.match("8折")?.result).toBeCloseTo(0.8);
      expect(chineseDiscountRule.match("9.5折")?.result).toBeCloseTo(0.95);
    });

    it("打折范围校验（0~10 之外不匹配）", () => {
      expect(chineseDiscountRule.match("100 11折")).toBeNull();
      expect(chineseDiscountRule.match("100 0折")).toBeNull();
    });
  });

  // === 半价 ===
  describe("半价", () => {
    it("半价（带金额）", () => {
      expect(chineseDiscountRule.match("100半价")?.result).toBe(50);
      expect(chineseDiscountRule.match("200 半价")?.result).toBe(100);
    });

    it("半价（无金额，返回 0.5）", () => {
      expect(chineseDiscountRule.match("半价")?.result).toBe(0.5);
    });
  });

  // === 满减 ===
  describe("满X减Y", () => {
    it("满200减50", () => {
      expect(chineseDiscountRule.match("满200减50")?.result).toBe(150);
      expect(chineseDiscountRule.match("满 200 减 50")?.result).toBe(150);
    });

    it("满1000减100", () => {
      expect(chineseDiscountRule.match("满1000减100")?.result).toBe(900);
    });

    it("千分位金额", () => {
      expect(chineseDiscountRule.match("满1,000减100")?.result).toBe(900);
    });
  });

  // === 涨/降百分比 ===
  describe("涨/降百分比", () => {
    it("涨10%（带金额）", () => {
      expect(chineseDiscountRule.match("100涨10%")?.result).toBeCloseTo(110);
      expect(chineseDiscountRule.match("100 涨 10%")?.result).toBeCloseTo(110);
    });

    it("降10%（带金额）", () => {
      expect(chineseDiscountRule.match("200降10%")?.result).toBeCloseTo(180);
    });

    it("涨10%（无金额，返回比率）", () => {
      expect(chineseDiscountRule.match("涨10%")?.result).toBeCloseTo(1.1);
      expect(chineseDiscountRule.match("降10%")?.result).toBeCloseTo(0.9);
    });
  });

  // === 不匹配 ===
  describe("不匹配的情况", () => {
    it("无折扣关键词", () => {
      expect(chineseDiscountRule.match("100")).toBeNull();
      expect(chineseDiscountRule.match("hello world")).toBeNull();
    });
  });
});
