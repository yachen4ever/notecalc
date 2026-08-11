import { describe, it, expect } from "vitest";
import { calculateLine, formatNumber, calculateSummary, tokenize } from "../composables/useCalculator";

// ============ V1: 基础计算 ============

describe("V1 - calculateLine 基础计算", () => {
  it("空行返回 null", () => {
    expect(calculateLine("").result).toBeNull();
    expect(calculateLine("   ").result).toBeNull();
    expect(calculateLine("\t").result).toBeNull();
  });

  it("纯数字", () => {
    expect(calculateLine("42").result).toBe(42);
    expect(calculateLine("0").result).toBe(0);
    expect(calculateLine("3.14").result).toBeCloseTo(3.14);
  });

  it("四则运算", () => {
    expect(calculateLine("1 + 2").result).toBe(3);
    expect(calculateLine("10 - 4").result).toBe(6);
    expect(calculateLine("6 * 7").result).toBe(42);
    expect(calculateLine("20 / 4").result).toBe(5);
    expect(calculateLine("7 % 3").result).toBe(1);
  });

  it("括号优先级", () => {
    expect(calculateLine("(1 + 2) * 3").result).toBe(9);
    expect(calculateLine("2 * (3 + 4)").result).toBe(14);
    expect(calculateLine("((1 + 2) * (3 + 4))").result).toBe(21);
  });

  it("运算优先级（先乘除后加减）", () => {
    expect(calculateLine("1 + 2 * 3").result).toBe(7);
    expect(calculateLine("10 - 6 / 2").result).toBe(7);
    expect(calculateLine("2 + 3 * 4 - 5").result).toBe(9);
  });

  it("负数", () => {
    expect(calculateLine("-5").result).toBe(-5);
    expect(calculateLine("-3 + 5").result).toBe(2);
    expect(calculateLine("3 * -2").result).toBe(-6);
  });

  it("小数运算", () => {
    expect(calculateLine("0.1 + 0.2").result).toBeCloseTo(0.3);
    expect(calculateLine("1.5 * 2").result).toBe(3);
    expect(calculateLine("10 / 3").result).toBeCloseTo(3.333333);
  });

  it("千分位逗号", () => {
    expect(calculateLine("1,000 + 2,000").result).toBe(3000);
    expect(calculateLine("1,234,567").result).toBe(1234567);
  });

  it("纯文字行返回 null（无数字）", () => {
    expect(calculateLine("hello world").result).toBeNull();
    expect(calculateLine("你好世界").result).toBeNull();
  });

  it("除零和非法表达式", () => {
    // expr-eval 把 "+ +" 解析为一元正号：1 + (+2) = 3
    expect(calculateLine("1 + + 2").result).toBe(3);
    // 除零 → expr-eval 返回 Infinity → 被 isFinite 过滤 → numberExtraction 提取数字 1
    expect(calculateLine("1 / 0").result).toBe(1);
  });
});

// ============ 中文大数单位 万/亿 ============

describe("中文大数单位", () => {
  it("基本万", () => {
    expect(calculateLine("1万").result).toBe(10000);
    expect(calculateLine("3万").result).toBe(30000);
    expect(calculateLine("3.5万").result).toBe(35000);
    expect(calculateLine("0.5万").result).toBe(5000);
  });

  it("基本亿", () => {
    expect(calculateLine("1亿").result).toBe(100000000);
    expect(calculateLine("2.5亿").result).toBe(250000000);
  });

  it("万 + 尾数", () => {
    expect(calculateLine("2万5").result).toBe(25000);
    expect(calculateLine("1万3").result).toBe(13000);
  });

  it("亿 + 尾数", () => {
    expect(calculateLine("1亿2").result).toBe(120000000);
  });

  it("万/亿 参与运算", () => {
    expect(calculateLine("1万 + 2万").result).toBe(30000);
    expect(calculateLine("1亿 + 2亿").result).toBe(300000000);
    expect(calculateLine("1万 * 2").result).toBe(20000);
  });

  it("-0 显示为 0", () => {
    expect(calculateLine("0 * -1").text).toBe("0");
    expect(calculateLine("-0.0000001").text).toBe("0");
  });
});

// ============ formatNumber ============

describe("formatNumber", () => {
  it("整数加千分位", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1234567)).toBe("1,234,567");
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(0)).toBe("0");
  });

  it("小数最多 6 位，去尾零", () => {
    expect(formatNumber(3.14)).toBe("3.14");
    expect(formatNumber(0.5)).toBe("0.5");
    expect(formatNumber(10 / 3)).toBe("3.333333");
    expect(formatNumber(2.5)).toBe("2.5");
  });

  it("负数", () => {
    expect(formatNumber(-1000)).toBe("-1,000");
    expect(formatNumber(-3.14)).toBe("-3.14");
  });

  it("小数的千分位", () => {
    expect(formatNumber(1234567.89)).toBe("1,234,567.89");
  });
});

// ============ calculateSummary ============

describe("calculateSummary", () => {
  it("多行汇总", () => {
    const lines = [
      { text: "100" },
      { text: "200" },
      { text: "300" },
    ];
    const { total, count } = calculateSummary(lines);
    expect(total).toBe(600);
    expect(count).toBe(3);
  });

  it("包含无效行跳过", () => {
    const lines = [
      { text: "100" },
      { text: "hello" },
      { text: "200" },
    ];
    const { total, count } = calculateSummary(lines);
    expect(total).toBe(300);
    expect(count).toBe(2);
  });

  it("全空行返回 null total", () => {
    const lines = [{ text: "" }, { text: "hello" }];
    const { total, count } = calculateSummary(lines);
    expect(total).toBeNull();
    expect(count).toBe(0);
  });

  it("空数组", () => {
    const { total, count } = calculateSummary([]);
    expect(total).toBeNull();
    expect(count).toBe(0);
  });

  it("含负数行", () => {
    const lines = [{ text: "100" }, { text: "-30" }];
    const { total, count } = calculateSummary(lines);
    expect(total).toBe(70);
    expect(count).toBe(2);
  });
});

// ============ tokenize 语法高亮 ============

describe("tokenize", () => {
  it("空字符串", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("数字 token", () => {
    const tokens = tokenize("42");
    expect(tokens).toHaveLength(1);
    expect(tokens[0].cls).toBe("tok-num");
  });

  it("运算符 token", () => {
    const tokens = tokenize("1 + 2");
    const ops = tokens.filter((t) => t.cls === "tok-op");
    expect(ops).toHaveLength(1);
    expect(ops[0].text).toBe("+");
  });

  it("行引用 token (l1/line2)", () => {
    const tokens = tokenize("l1 + line2");
    const refs = tokens.filter((t) => t.cls === "tok-var");
    expect(refs).toHaveLength(2);
    expect(refs[0].text).toBe("l1");
    expect(refs[1].text).toBe("line2");
  });

  it("赋值等号 token", () => {
    const tokens = tokenize("单价 = 100");
    const assigns = tokens.filter((t) => t.cls === "tok-assign");
    expect(assigns).toHaveLength(1);
    expect(assigns[0].text).toBe("=");
  });

  it("纯文字无特殊 token", () => {
    const tokens = tokenize("hello world");
    expect(tokens.every((t) => t.cls === "")).toBe(true);
  });
});
