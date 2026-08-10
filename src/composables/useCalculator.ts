import { evaluate } from "mathjs";
import type { LineResult } from "../types";

/**
 * 解析单行文本，返回计算结果
 * - 空行或纯文字返回 null
 * - 纯数字返回该数字
 * - 表达式返回计算结果
 * - 语法错误返回 null
 */
export function calculateLine(text: string): LineResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return { result: null, text: "" };
  }

  try {
    const value = evaluate(trimmed);
    if (typeof value === "number" && !isNaN(value) && isFinite(value)) {
      return { result: value, text: formatNumber(value) };
    }
    return { result: null, text: "" };
  } catch {
    return { result: null, text: "" };
  }
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
 * V1：数字蓝色，运算符青色，其余默认色
 */
export function tokenize(text: string): HighlightToken[] {
  if (!text) return [];

  const tokens: HighlightToken[] = [];
  const regex = /(\d[\d,]*\.?\d*)|([+\-*/()])/g;
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
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), cls: "" });
  }

  return tokens;
}
