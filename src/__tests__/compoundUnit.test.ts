import { describe, it, expect } from "vitest";
import { compoundUnitRule } from "../composables/rules/compoundUnit";

describe("V6 - 复合单位归一化 (compoundUnit)", () => {
  // ===== 时间复合 =====
  it("1天20小时48分钟 → 归一化为秒，默认展示天", () => {
    const result = compoundUnitRule.match("1天20小时48分钟");
    expect(result).not.toBeNull();
    expect(result!.result).toBeCloseTo(1 * 86400 + 20 * 3600 + 48 * 60, 0);
    expect(result!.text).toContain("天");
    expect(result!.unitInfo).toBeDefined();
    expect(result!.unitInfo!.category).toBe("time");
    expect(result!.unitInfo!.defaultUnitIndex).toBe(0); // 天是最大的单位
  });

  it("2小时30分钟 → 默认展示小时", () => {
    const result = compoundUnitRule.match("2小时30分钟");
    expect(result).not.toBeNull();
    expect(result!.result).toBeCloseTo(2 * 3600 + 30 * 60, 0);
    expect(result!.text).toContain("小时");
    expect(result!.text).toContain("2.5");
  });

  it("90秒 + 500毫秒 → 默认展示秒", () => {
    const result = compoundUnitRule.match("90秒 + 500毫秒");
    expect(result).not.toBeNull();
    expect(result!.result).toBeCloseTo(90.5, 1);
    expect(result!.text).toContain("秒");
  });

  // ===== 重量复合 =====
  it("1kg + 200g → 默认展示 kg", () => {
    const result = compoundUnitRule.match("1kg + 200g");
    expect(result).not.toBeNull();
    // 基准是克，1kg = 1000g + 200g = 1200g
    expect(result!.result).toBe(1200);
    expect(result!.text).toContain("千克");
    expect(result!.text).toContain("1.2");
  });

  it("2斤 3两 → 默认展示斤", () => {
    const result = compoundUnitRule.match("2斤 3两");
    expect(result).not.toBeNull();
    // 2斤 = 1000g, 3两 = 150g, total = 1150g
    expect(result!.result).toBe(1150);
    expect(result!.text).toContain("斤");
  });

  // ===== 长度复合 =====
  it("1km 500m 20cm → 默认展示 km", () => {
    const result = compoundUnitRule.match("1km 500m 20cm");
    expect(result).not.toBeNull();
    // 基准是米：1000 + 500 + 0.2 = 1500.2m
    expect(result!.result).toBeCloseTo(1500.2, 2);
    expect(result!.text).toContain("千米");
    expect(result!.text).toContain("1.5");
  });

  it("5英尺 6英寸 → 复合英制长度", () => {
    const result = compoundUnitRule.match("5英尺 6英寸");
    expect(result).not.toBeNull();
    // 5ft = 1.524m, 6in = 0.1524m, total = 1.6764m
    expect(result!.result).toBeCloseTo(1.6764, 3);
  });

  // ===== 体积复合 =====
  it("2L 500ml → 默认展示 L", () => {
    const result = compoundUnitRule.match("2L 500ml");
    expect(result).not.toBeNull();
    // 基准是升：2 + 0.5 = 2.5L
    expect(result!.result).toBeCloseTo(2.5, 2);
    expect(result!.text).toContain("升");
  });

  // ===== + 号连接 vs 空格连接 =====
  it("+ 号和空格拼接效果相同", () => {
    const r1 = compoundUnitRule.match("1kg 200g");
    const r2 = compoundUnitRule.match("1kg + 200g");
    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(r1!.result).toBe(r2!.result);
  });

  // ===== 减法运算 =====
  it("1天 - 10小时 → 减法，0.58 天", () => {
    const result = compoundUnitRule.match("1天 - 10小时");
    expect(result).not.toBeNull();
    // 1天 = 86400秒, 10小时 = 36000秒, 差 = 50400秒
    expect(result!.result).toBe(50400);
    expect(result!.text).toContain("天");
    expect(result!.text).toContain("0.58");
  });

  it("1天-10小时 → 无空格减法也能识别", () => {
    const result = compoundUnitRule.match("1天-10小时");
    expect(result).not.toBeNull();
    expect(result!.result).toBe(50400);
    expect(result!.text).toContain("0.58");
  });

  it("2kg - 500g → 减法", () => {
    const result = compoundUnitRule.match("2kg - 500g");
    expect(result).not.toBeNull();
    // 2kg = 2000g, 500g, 差 = 1500g
    expect(result!.result).toBe(1500);
    expect(result!.text).toContain("千克");
    expect(result!.text).toContain("1.5");
  });

  it("5km - 200m → 减法", () => {
    const result = compoundUnitRule.match("5km - 200m");
    expect(result).not.toBeNull();
    // 5km = 5000m, 200m, 差 = 4800m
    expect(result!.result).toBe(4800);
    expect(result!.text).toContain("千米");
  });

  it("1天 - 2小时 + 30分钟 → 混合加减", () => {
    const result = compoundUnitRule.match("1天 - 2小时 + 30分钟");
    expect(result).not.toBeNull();
    // 86400 - 7200 + 1800 = 81000秒
    expect(result!.result).toBe(81000);
    expect(result!.text).toContain("天");
  });

  it("减法结果为负数也正常计算", () => {
    const result = compoundUnitRule.match("100g - 2kg");
    expect(result).not.toBeNull();
    // 100 - 2000 = -1900g
    expect(result!.result).toBe(-1900);
  });

  it("+ 号和空格的混合使用", () => {
    const r1 = compoundUnitRule.match("1天 2小时 30分钟");
    const r2 = compoundUnitRule.match("1天 + 2小时 + 30分钟");
    const r3 = compoundUnitRule.match("1天 + 2小时 30分钟");
    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(r3).not.toBeNull();
    expect(r1!.result).toBe(r2!.result);
    expect(r1!.result).toBe(r3!.result);
  });

  // ===== 单单位也触发（可切换） =====
  it("1小时 → 单单位也触发，默认展示小时，可切换", () => {
    const result = compoundUnitRule.match("1小时");
    expect(result).not.toBeNull();
    expect(result!.result).toBe(3600); // 基准秒
    expect(result!.text).toContain("小时");
    expect(result!.text).toContain("1");
    expect(result!.unitInfo).toBeDefined();
    expect(result!.unitInfo!.category).toBe("time");
    expect(result!.unitInfo!.units.length).toBeGreaterThanOrEqual(2);
  });

  it("5km → 单单位默认展示千米", () => {
    const result = compoundUnitRule.match("5km");
    expect(result).not.toBeNull();
    expect(result!.result).toBe(5000); // 基准米
    expect(result!.text).toContain("千米");
    expect(result!.text).toContain("5");
  });

  it("100kg → 单单位默认展示千克", () => {
    const result = compoundUnitRule.match("100kg");
    expect(result).not.toBeNull();
    expect(result!.result).toBe(100000); // 基准克
    expect(result!.text).toContain("千克");
    expect(result!.text).toContain("100");
  });

  // ===== 边界 case =====

  it("包含转换关键词时不触发（交给 unitConversionRule）", () => {
    expect(compoundUnitRule.match("5km to mi")).toBeNull();
    expect(compoundUnitRule.match("100kg转斤")).toBeNull();
  });

  it("不同类别的单位不触发", () => {
    expect(compoundUnitRule.match("1km 100g")).toBeNull();
    expect(compoundUnitRule.match("1天 1kg")).toBeNull();
  });

  it("温度不触发复合规则", () => {
    expect(compoundUnitRule.match("30摄氏度 20华氏度")).toBeNull();
  });

  it("无单位文本不触发", () => {
    expect(compoundUnitRule.match("餐饮 340 打车 86")).toBeNull();
    expect(compoundUnitRule.match("hello world")).toBeNull();
  });

  // ===== unitInfo 结构验证 =====
  it("unitInfo 包含完整的可切换单位列表", () => {
    const result = compoundUnitRule.match("1天20小时");
    expect(result).not.toBeNull();
    const info = result!.unitInfo!;
    expect(info.units.length).toBeGreaterThan(1);
    // 所有单位都应该有 label 和 factor
    for (const u of info.units) {
      expect(u.label).toBeTruthy();
      expect(u.factor).toBeGreaterThan(0);
    }
  });

  it("默认单位是输入中的最大单位", () => {
    const result = compoundUnitRule.match("30分钟 45秒");
    expect(result).not.toBeNull();
    const info = result!.unitInfo!;
    const defaultUnit = info.units[info.defaultUnitIndex];
    // 分钟比秒大，所以默认应该是分钟
    expect(defaultUnit.factor).toBe(60);
  });
});

describe("V6.1 - 紧凑时间格式 (compact time)", () => {
  it("3h24m → 3.4 小时", () => {
    const result = compoundUnitRule.match("3h24m");
    expect(result).not.toBeNull();
    // 3h + 24m = 10800 + 1440 = 12240 秒
    expect(result!.result).toBe(12240);
    expect(result!.text).toContain("小时");
    expect(result!.text).toContain("3.4");
    expect(result!.unitInfo!.category).toBe("time");
  });

  it("1d2h30m → 默认展示天", () => {
    const result = compoundUnitRule.match("1d2h30m");
    expect(result).not.toBeNull();
    // 86400 + 7200 + 1800 = 95400 秒
    expect(result!.result).toBe(95400);
    expect(result!.text).toContain("天");
    expect(result!.unitInfo!.defaultUnitIndex).toBe(0);
  });

  it("90min → 默认展示分钟", () => {
    const result = compoundUnitRule.match("90min");
    expect(result).not.toBeNull();
    expect(result!.result).toBe(5400);
    expect(result!.text).toContain("分钟");
  });

  it("45s → 默认展示秒", () => {
    const result = compoundUnitRule.match("45s");
    expect(result).not.toBeNull();
    expect(result!.result).toBe(45);
    expect(result!.text).toContain("秒");
  });

  it("3.5h → 支持小数", () => {
    const result = compoundUnitRule.match("3.5h");
    expect(result).not.toBeNull();
    expect(result!.result).toBe(12600);
    expect(result!.text).toContain("小时");
  });

  it("中文紧凑 2小时30分 → 2.5 小时", () => {
    const result = compoundUnitRule.match("2小时30分");
    expect(result).not.toBeNull();
    expect(result!.result).toBe(9000);
    expect(result!.text).toContain("2.5");
  });

  it("带加减 1d - 2h → 减法", () => {
    const result = compoundUnitRule.match("1d - 2h");
    expect(result).not.toBeNull();
    // 86400 - 7200 = 79200
    expect(result!.result).toBe(79200);
  });

  it("5km 不触发紧凑时间规则（m 是米）", () => {
    const result = compoundUnitRule.match("5km");
    expect(result).not.toBeNull();
    // 应走通用复合单位路径，归一到千米
    expect(result!.unitInfo!.category).toBe("length");
  });

  it("1km 500m 不误判（空格分隔的复合长度）", () => {
    const result = compoundUnitRule.match("1km 500m");
    expect(result).not.toBeNull();
    expect(result!.unitInfo!.category).toBe("length");
    expect(result!.result).toBeCloseTo(1500, 2);
  });

  it("3h30m + 2h → 混合运算", () => {
    const result = compoundUnitRule.match("3h30m + 2h");
    expect(result).not.toBeNull();
    // (3*3600 + 30*60) + 2*3600 = 19800
    expect(result!.result).toBe(19800);
  });
});
