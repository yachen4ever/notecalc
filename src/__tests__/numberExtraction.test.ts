import { describe, it, expect } from "vitest";
import { numberExtractionRule } from "../composables/rules/numberExtraction";

describe("V2 - 数字提取求和规则 (numberExtraction)", () => {
  it("多数字求和", () => {
    expect(numberExtractionRule.match("餐饮340 打车86")?.result).toBe(426);
    expect(numberExtractionRule.match("午餐 25 晚餐 58")?.result).toBe(83);
    expect(numberExtractionRule.match("工资 8000 房租 2500")?.result).toBe(10500);
  });

  it("单数字也提取", () => {
    expect(numberExtractionRule.match("收入 5000")?.result).toBe(5000);
    expect(numberExtractionRule.match("42")?.result).toBe(42);
  });

  it("含小数", () => {
    expect(numberExtractionRule.match("苹果3.5 香蕉2.5")?.result).toBeCloseTo(6);
  });

  it("含千分位", () => {
    expect(numberExtractionRule.match("收入 8,000 房租 2,500")?.result).toBe(10500);
  });

  it("无数字返回 null", () => {
    expect(numberExtractionRule.match("hello world")).toBeNull();
    expect(numberExtractionRule.match("")).toBeNull();
  });

  it("含语义关键词时不兜底求和", () => {
    expect(numberExtractionRule.match("比100少20%")).toBeNull();
    expect(numberExtractionRule.match("比100多20")).toBeNull();
    expect(numberExtractionRule.match("100和200的平均")).toBeNull();
    expect(numberExtractionRule.match("2的3次方")).toBeNull();
    expect(numberExtractionRule.match("16的平方根")).toBeNull();
    expect(numberExtractionRule.match("100是总数的百分之几")).toBeNull();
  });
});
