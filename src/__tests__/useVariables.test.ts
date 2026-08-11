import { describe, it, expect } from "vitest";
import {
  extractAssignment,
  findLineRefs,
  findVarRefs,
  buildLineResults,
  toLineResults,
} from "../composables/useVariables";
import type { Line } from "../types";

// ============ extractAssignment ============

describe("V4 - extractAssignment 命名变量赋值", () => {
  it("中文变量名", () => {
    const result = extractAssignment("单价 = 100");
    expect(result).toEqual({ name: "单价", value: 100 });
  });

  it("英文变量名", () => {
    const result = extractAssignment("price = 200");
    expect(result).toEqual({ name: "price", value: 200 });
  });

  it("带空格", () => {
    const result = extractAssignment("税率  =  0.15");
    expect(result).toEqual({ name: "税率", value: 0.15 });
  });

  it("右侧为表达式", () => {
    const result = extractAssignment("总和 = 100 + 200");
    expect(result).toEqual({ name: "总和", value: 300 });
  });

  it("非赋值语句返回 null", () => {
    expect(extractAssignment("100 + 200")).toBeNull();
    expect(extractAssignment("hello")).toBeNull();
    expect(extractAssignment("100 = 200")).toBeNull(); // 数字开头的不是合法变量名
  });

  it("右侧无效返回 null", () => {
    expect(extractAssignment("未知 = hello")).toBeNull();
  });
});

// ============ findLineRefs ============

describe("V4 - findLineRefs 行引用检测", () => {
  it("l1 格式", () => {
    const refs = findLineRefs("l1 + 100");
    expect(refs).toEqual([{ marker: "l1", lineIndex: 0 }]);
  });

  it("line2 格式", () => {
    const refs = findLineRefs("line2 * 3");
    expect(refs).toEqual([{ marker: "line2", lineIndex: 1 }]);
  });

  it("多个行引用", () => {
    const refs = findLineRefs("l1 + l2 + l3");
    expect(refs).toEqual([
      { marker: "l1", lineIndex: 0 },
      { marker: "l2", lineIndex: 1 },
      { marker: "l3", lineIndex: 2 },
    ]);
  });

  it("大小写不敏感", () => {
    const refs = findLineRefs("L1 + LINE2");
    expect(refs).toHaveLength(2);
  });

  it("无引用返回空数组", () => {
    expect(findLineRefs("100 + 200")).toEqual([]);
    expect(findLineRefs("hello")).toEqual([]);
  });
});

// ============ findVarRefs ============

describe("V4 - findVarRefs 命名变量引用检测", () => {
  it("检测中文变量引用", () => {
    expect(findVarRefs("单价 * 12")).toContain("单价");
  });

  it("检测英文变量引用", () => {
    expect(findVarRefs("price * 12")).toContain("price");
  });

  it("赋值语句排除左侧", () => {
    const refs = findVarRefs("总价 = 单价 * 12");
    expect(refs).not.toContain("总价");
    expect(refs).toContain("单价");
  });

  it("多个变量引用", () => {
    const refs = findVarRefs("长 * 宽");
    expect(refs).toContain("长");
    expect(refs).toContain("宽");
  });

  it("无变量引用", () => {
    expect(findVarRefs("100 + 200")).toEqual([]);
  });
});

// ============ buildLineResults ============

describe("V4 - buildLineResults 工作表计算", () => {
  // 辅助函数：将字符串数组转为 Line[]
  function makeLines(texts: string[]): Line[] {
    return texts.map((text, i) => ({ id: i + 1, text }));
  }

  // --- 基础计算 ---
  describe("基础逐行计算", () => {
    it("多行四则运算", () => {
      const lines = makeLines(["100", "200", "100 + 200"]);
      const results = buildLineResults(lines);
      expect(results[0].result).toBe(100);
      expect(results[1].result).toBe(200);
      expect(results[2].result).toBe(300);
    });

    it("空行处理", () => {
      const lines = makeLines(["100", "", "200"]);
      const results = buildLineResults(lines);
      expect(results[0].result).toBe(100);
      expect(results[1].result).toBeNull();
      expect(results[2].result).toBe(200);
    });

    it("无效行处理", () => {
      const lines = makeLines(["hello world", "100"]);
      const results = buildLineResults(lines);
      expect(results[0].result).toBeNull();
      expect(results[1].result).toBe(100);
    });
  });

  // --- 行引用 ---
  describe("行引用 l1/line2", () => {
    it("l1 引用第1行", () => {
      const lines = makeLines(["100", "l1 * 2"]);
      const results = buildLineResults(lines);
      expect(results[0].result).toBe(100);
      expect(results[1].result).toBe(200);
    });

    it("line2 引用第2行", () => {
      const lines = makeLines(["10", "20", "l1 + line2"]);
      const results = buildLineResults(lines);
      expect(results[2].result).toBe(30);
    });

    it("多行引用 l1 + l2 + l3", () => {
      const lines = makeLines(["10", "20", "30", "l1 + l2 + l3"]);
      const results = buildLineResults(lines);
      expect(results[3].result).toBe(60);
    });

    it("引用空行报错（不再静默替换为 0）", () => {
      const lines = makeLines(["", "l1 + 100"]);
      const results = buildLineResults(lines);
      expect(results[1].error).toContain("前向引用");
      expect(results[1].result).toBeNull();
    });

    it("自引用报错（不再静默替换为 0）", () => {
      const lines = makeLines(["l1 + 100"]);
      const results = buildLineResults(lines);
      expect(results[0].error).toContain("自引用");
      expect(results[0].result).toBeNull();
    });

    it("行引用参与复杂运算", () => {
      const lines = makeLines(["100", "50", "(l1 + line2) / 2"]);
      const results = buildLineResults(lines);
      expect(results[2].result).toBe(75);
    });
  });

  // --- 命名变量 ---
  describe("命名变量", () => {
    it("单价 = 100, 后续引用单价", () => {
      const lines = makeLines(["单价 = 100", "单价 * 12"]);
      const results = buildLineResults(lines);
      expect(results[0].result).toBe(100);
      expect(results[1].result).toBe(1200);
    });

    it("多个命名变量", () => {
      const lines = makeLines([
        "长 = 10",
        "宽 = 5",
        "长 * 宽",
      ]);
      const results = buildLineResults(lines);
      expect(results[0].result).toBe(10);
      expect(results[1].result).toBe(5);
      expect(results[2].result).toBe(50);
    });

    it("命名变量在赋值右侧引用", () => {
      const lines = makeLines([
        "单价 = 100",
        "数量 = 12",
        "总价 = 单价 * 数量",
      ]);
      const results = buildLineResults(lines);
      expect(results[0].result).toBe(100);
      expect(results[1].result).toBe(12);
      expect(results[2].result).toBe(1200);
    });

    it("命名变量与行引用混合", () => {
      const lines = makeLines([
        "税率 = 0.15",
        "1000",
        "l2 * 税率",
      ]);
      const results = buildLineResults(lines);
      expect(results[0].result).toBeCloseTo(0.15);
      expect(results[1].result).toBe(1000);
      expect(results[2].result).toBeCloseTo(150);
    });

    it("赋值右侧为表达式", () => {
      const lines = makeLines(["总价 = 100 + 200", "总价 / 2"]);
      const results = buildLineResults(lines);
      expect(results[0].result).toBe(300);
      expect(results[1].result).toBe(150);
    });
  });

  // --- 聚合函数与行引用配合 ---
  describe("聚合函数", () => {
    it("总和 + 行引用", () => {
      const lines = makeLines(["10", "20", "30", "总和 l1 l2 l3"]);
      const results = buildLineResults(lines);
      expect(results[3].result).toBe(60);
    });

    it("平均 + 行引用", () => {
      const lines = makeLines(["10", "20", "30", "平均 l1 l2 l3"]);
      const results = buildLineResults(lines);
      expect(results[3].result).toBe(20);
    });
  });

  // --- 语义规则与行引用配合 ---
  describe("语义规则 + 行引用", () => {
    it("中文折扣 + 行引用", () => {
      const lines = makeLines(["100", "l1 打8折"]);
      const results = buildLineResults(lines);
      expect(results[1].result).toBeCloseTo(80);
    });

    it("单位转换 + 行引用", () => {
      const lines = makeLines(["5", "l1 km to mi"]);
      const results = buildLineResults(lines);
      expect(results[1].result).toBeCloseTo(3.107, 2);
    });
  });

  // --- assignment 字段 ---
  describe("assignment 字段", () => {
    it("赋值行有 assignment", () => {
      const lines = makeLines(["单价 = 100"]);
      const results = buildLineResults(lines);
      expect(results[0].assignment).toEqual({ name: "单价", value: 100 });
    });

    it("非赋值行 assignment 为 null", () => {
      const lines = makeLines(["100 + 200"]);
      const results = buildLineResults(lines);
      expect(results[0].assignment).toBeNull();
    });
  });

  // --- deps 字段 ---
  describe("deps 依赖追踪", () => {
    it("行引用记录 deps", () => {
      const lines = makeLines(["100", "l1 * 2"]);
      const results = buildLineResults(lines);
      expect(results[1].deps).toContain(0);
    });

    it("无引用行 deps 为空", () => {
      const lines = makeLines(["100"]);
      const results = buildLineResults(lines);
      expect(results[0].deps).toEqual([]);
    });
  });
});

// ============ toLineResults 兼容接口 ============

describe("V4 - toLineResults 兼容接口", () => {
  it("从 buildLineResults 转 LineResult[]", () => {
    const lines: Line[] = [
      { id: 1, text: "100" },
      { id: 2, text: "hello" },
    ];
    const computeResults = buildLineResults(lines);
    const lineResults = toLineResults(computeResults);
    expect(lineResults).toHaveLength(2);
    expect(lineResults[0].result).toBe(100);
    expect(lineResults[1].result).toBeNull();
  });
});

// ============ 引用错误检测 ============

describe("V5 - 引用错误检测", () => {
  function makeLines(texts: string[]): Line[] {
    return texts.map((t, i) => ({ id: i + 1, text: t }));
  }

  it("前向引用报错", () => {
    const lines = makeLines(["l2 + 100", "200"]);
    const results = buildLineResults(lines);
    expect(results[0].error).toBeTruthy();
    expect(results[0].error).toContain("前向引用");
    expect(results[0].result).toBeNull();
  });

  it("自引用报错", () => {
    const lines = makeLines(["l1 + 100"]);
    const results = buildLineResults(lines);
    expect(results[0].error).toContain("自引用");
    expect(results[0].result).toBeNull();
  });

  it("越界引用报错", () => {
    const lines = makeLines(["l999 + 100"]);
    const results = buildLineResults(lines);
    expect(results[0].error).toContain("不存在");
    expect(results[0].result).toBeNull();
  });

  it("l0 越界报错（0-based 索引 -1）", () => {
    const lines = makeLines(["l0 + 100"]);
    const results = buildLineResults(lines);
    expect(results[0].error).toContain("不存在");
  });

  it("正常后向引用不报错", () => {
    const lines = makeLines(["100", "l1 * 2"]);
    const results = buildLineResults(lines);
    expect(results[1].error).toBeUndefined();
    expect(results[1].result).toBe(200);
  });

  it("赋值语句中的前向引用报错", () => {
    const lines = makeLines(["总价 = l2 * 2", "100"]);
    const results = buildLineResults(lines);
    expect(results[0].error).toContain("前向引用");
  });

  it("toLineResults 传递 error 字段", () => {
    const lines = makeLines(["l2 + 100", "200"]);
    const results = toLineResults(buildLineResults(lines));
    expect(results[0].error).toBeTruthy();
  });

  it("变量名与行引用格式冲突报错", () => {
    const lines = makeLines(["l1 = 42", "l1 + 100"]);
    const results = buildLineResults(lines);
    expect(results[0].error).toContain("冲突");
  });

  it("变量名 line1 也冲突", () => {
    const lines = makeLines(["line1 = 42"]);
    const results = buildLineResults(lines);
    expect(results[0].error).toContain("冲突");
  });
});
