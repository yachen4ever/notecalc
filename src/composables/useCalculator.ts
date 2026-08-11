import { evaluate } from "mathjs";
import type { LineResult } from "../types";
import { rules } from "./rules/engine";
import { numberExtractionRule } from "./rules/numberExtraction";
import { chineseDiscountRule } from "./rules/chineseDiscount";
import { chinesePercentRule } from "./rules/chinesePercent";
import { englishPercentRule } from "./rules/englishPercent";
import { unitConversionRule } from "./rules/unitConversion";
import { aggregateRule } from "./rules/aggregate";

// 注册语义规则（按优先级排序）
rules.push(
  chineseDiscountRule, // 中文折扣/半价/满减/涨降
  chinesePercentRule, // 中文百分比运算（120的15%、占百分比）
  englishPercentRule, // 英文百分比（10% off、10% of）
  unitConversionRule, // 单位转换（5km to mi）
  aggregateRule, // 聚合函数（平均/最大/最小/总和）
  numberExtractionRule, // 数字提取求和（兜底）
);

/**
 * 解析单行文本，返回计算结果
 *
 * 多级管线：
 * 1. 空行 → null
 * 2. mathjs 表达式（四则运算、纯数字、括号）→ 直接返回
 * 3. 语义规则引擎（中文折扣、英文百分比、数字提取求和）→ 依次尝试
 * 4. 全部失败 → null
 */
export function calculateLine(text: string): LineResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return { result: null, text: "" };
  }

  // 第1级：mathjs 表达式
  try {
    const value = evaluate(trimmed);
    if (typeof value === "number" && !isNaN(value) && isFinite(value)) {
      return { result: value, text: formatNumber(value) };
    }
  } catch {
    // mathjs 失败，继续走语义规则
  }

  // 第2级：语义规则引擎
  for (const rule of rules) {
    const result = rule.match(trimmed);
    if (result !== null) {
      return result;
    }
  }

  return { result: null, text: "" };
}

/**
 * 格式化数字显示
 * - 整数直接显示，加千分位
 * - 小数最多保留 6 位，去掉末尾多余的 0
 */
export function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString("en-US");
  }

  const rounded = Math.round(value * 1e6) / 1e6;
  const str = rounded.toFixed(6).replace(/\.?0+$/, "");
  const parts = str.split(".");
  parts[0] = Number(parts[0]).toLocaleString("en-US");
  return parts.join(".");
}

/**
 * 计算所有有效行的汇总
 */
export function calculateSummary(lines: Array<{ text: string }>): { total: number | null; count: number } {
  let total = 0;
  let count = 0;

  for (const line of lines) {
    const { result } = calculateLine(line.text);
    if (result !== null) {
      total += result;
      count++;
    }
  }

  return count > 0 ? { total, count } : { total: null, count: 0 };
}

/**
 * 语法高亮 token
 */
export interface HighlightToken {
  text: string;
  cls: string;
}

/**
 * 语法高亮：将文本转为 token 数组
 * V4：数字蓝色、运算符青色、行引用(l1/line2)和命名变量紫色、赋值箭头橙色、纯文字灰色
 */
export function tokenize(text: string): HighlightToken[] {
  if (!text) return [];

  const tokens: HighlightToken[] = [];
  // 匹配：数字 | 运算符 | 行引用(l1/line2) | 赋值(=) | 命名变量
  const regex = /(\d[\d,]*\.?\d*)|([+\-*/()])|(?<![a-zA-Z])(l|line)(\d+)|([=])/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, match.index), cls: "" });
    }
    if (match[1]) {
      tokens.push({ text: match[0], cls: "tok-num" });
    } else if (match[2]) {
      tokens.push({ text: match[0], cls: "tok-op" });
    } else if (match[3] && match[4]) {
      // 行引用 l1 / line2
      tokens.push({ text: match[0], cls: "tok-var" });
    } else if (match[5]) {
      // 赋值 =
      tokens.push({ text: match[0], cls: "tok-assign" });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), cls: "" });
  }

  return tokens;
}
