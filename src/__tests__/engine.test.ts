import { describe, it, expect } from "vitest";
import { parseNumber, extractNumbers } from "../composables/rules/engine";

describe("engine - parseNumber", () => {
  it("纯整数", () => {
    expect(parseNumber("42")).toBe(42);
    expect(parseNumber("0")).toBe(0);
  });

  it("小数", () => {
    expect(parseNumber("3.14")).toBeCloseTo(3.14);
    expect(parseNumber("0.5")).toBe(0.5);
  });

  it("千分位逗号", () => {
    expect(parseNumber("1,000")).toBe(1000);
    expect(parseNumber("1,234,567")).toBe(1234567);
    expect(parseNumber("1,000.5")).toBe(1000.5);
  });

  it("空白 trim", () => {
    expect(parseNumber("  42  ")).toBe(42);
  });

  it("非法返回 null", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("NaN")).toBeNull();
    expect(parseNumber("Infinity")).toBeNull();
  });

  it("负数", () => {
    expect(parseNumber("-5")).toBe(-5);
    expect(parseNumber("-3.14")).toBeCloseTo(-3.14);
  });
});

describe("engine - extractNumbers", () => {
  it("无数字返回空数组", () => {
    expect(extractNumbers("hello world")).toEqual([]);
    expect(extractNumbers("")).toEqual([]);
  });

  it("单个数字", () => {
    expect(extractNumbers("收入 5000")).toEqual([5000]);
    expect(extractNumbers("42")).toEqual([42]);
  });

  it("多个数字", () => {
    expect(extractNumbers("餐饮340 打车86")).toEqual([340, 86]);
    expect(extractNumbers("100 200 300")).toEqual([100, 200, 300]);
  });

  it("含小数", () => {
    expect(extractNumbers("3.14 和 2.72")).toEqual([3.14, 2.72]);
  });

  it("含千分位", () => {
    expect(extractNumbers("工资 8,000 房租 2,500")).toEqual([8000, 2500]);
  });
});
