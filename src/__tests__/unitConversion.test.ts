import { describe, it, expect } from "vitest";
import { unitConversionRule } from "../composables/rules/unitConversion";

describe("V2 - 单位转换规则 (unitConversion)", () => {
  // === 长度 ===
  describe("长度", () => {
    it("5km to mi", () => {
      const result = unitConversionRule.match("5km to mi")?.result;
      expect(result).toBeCloseTo(3.107, 2);
    });

    it("1000米 转 千米", () => {
      const result = unitConversionRule.match("1000米 转 千米")?.result;
      expect(result).toBeCloseTo(1);
    });

    it("1英里 等于多少 千米", () => {
      const result = unitConversionRule.match("1英里 等于多少 千米")?.result;
      expect(result).toBeCloseTo(1.609, 2);
    });

    it("100kg转斤", () => {
      const result = unitConversionRule.match("100kg 转 斤")?.result;
      expect(result).toBeCloseTo(200);
    });
  });

  // === 重量 ===
  describe("重量", () => {
    it("1kg to g", () => {
      expect(unitConversionRule.match("1kg to g")?.result).toBeCloseTo(1000);
    });

    it("1磅 to 克", () => {
      const result = unitConversionRule.match("1磅 to 克")?.result;
      expect(result).toBeCloseTo(453.592, 1);
    });
  });

  // === 温度（非线性转换） ===
  describe("温度", () => {
    it("30摄氏度转华氏", () => {
      expect(unitConversionRule.match("30摄氏度 转 华氏")?.result).toBeCloseTo(86);
    });

    it("0摄氏度转华氏", () => {
      expect(unitConversionRule.match("0摄氏度 转华氏度")?.result).toBeCloseTo(32);
    });

    it("100摄氏度转华氏", () => {
      expect(unitConversionRule.match("100摄氏度 转 华氏")?.result).toBeCloseTo(212);
    });

    it("0c to k", () => {
      expect(unitConversionRule.match("0c to k")?.result).toBeCloseTo(273.15);
    });
  });

  // === 面积 ===
  describe("面积", () => {
    it("1km2 to m2", () => {
      expect(unitConversionRule.match("1km2 to m2")?.result).toBeCloseTo(1_000_000);
    });

    it("1亩 转 平方米", () => {
      const result = unitConversionRule.match("1亩 转 平方米")?.result;
      expect(result).toBeCloseTo(666.667, 1);
    });
  });

  // === 体积 ===
  describe("体积", () => {
    it("1L to ml", () => {
      expect(unitConversionRule.match("1L to ml")?.result).toBeCloseTo(1000);
    });

    it("1加仑 转 升", () => {
      const result = unitConversionRule.match("1加仑 转 升")?.result;
      expect(result).toBeCloseTo(3.785, 2);
    });
  });

  // === 时间 ===
  describe("时间", () => {
    it("1h to s", () => {
      expect(unitConversionRule.match("1h to s")?.result).toBeCloseTo(3600);
    });

    it("1天 转 小时", () => {
      expect(unitConversionRule.match("1天 转 小时")?.result).toBeCloseTo(24);
    });
  });

  // === 边界 ===
  describe("边界情况", () => {
    it("无转换关键词不匹配", () => {
      expect(unitConversionRule.match("5km mi")).toBeNull();
    });

    it("不同类别不匹配", () => {
      expect(unitConversionRule.match("5km to kg")).toBeNull();
    });

    it("无目标单位不匹配", () => {
      expect(unitConversionRule.match("5km to")).toBeNull();
    });
  });
});
