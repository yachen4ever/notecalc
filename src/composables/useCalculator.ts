import { Parser } from "expr-eval";
import type { LineResult } from "../types";
import { rules } from "./rules/engine";
import { numberExtractionRule } from "./rules/numberExtraction";
import { chineseDiscountRule } from "./rules/chineseDiscount";
import { chinesePercentRule } from "./rules/chinesePercent";
import { englishPercentRule } from "./rules/englishPercent";
import { unitConversionRule } from "./rules/unitConversion";
import { compoundUnitRule } from "./rules/compoundUnit";
import { aggregateRule } from "./rules/aggregate";

// ===== 格式化选项（全局上下文，由 App.vue 设置） =====
interface FormatOptions {
  decimals: number;
  thousands: boolean;
}

let formatOptions: FormatOptions = { decimals: 2, thousands: true };

/** 设置全局格式化选项（由 App.vue 调用） */
export function setFormatOptions(decimals: number, thousands: boolean) {
  formatOptions = { decimals, thousands };
}

// 预编译表达式解析器（四则运算 + 括号 + 一元负号 + 取模）
const parser = new Parser();

// 注册语义规则（按优先级排序）
rules.push(
  chineseDiscountRule, // 中文折扣/半价/满减/涨降
  chinesePercentRule, // 中文百分比运算（120的15%、占百分比）
  englishPercentRule, // 英文百分比（10% off、10% of）
  unitConversionRule, // 单位转换（5km to mi）
  compoundUnitRule, // 复合单位归一化（1天20小时48分钟）
  aggregateRule, // 聚合函数（平均/最大/最小/总和）
  numberExtractionRule, // 数字提取求和（兜底）
);

/**
 * 解析单行文本，返回计算结果
 *
 * 多级管线：
 * 1. 空行 → null
 * 2. expr-eval 表达式（四则运算、纯数字、括号）→ 直接返回
 * 3. 语义规则引擎（中文折扣、英文百分比、数字提取求和）→ 依次尝试
 * 4. 全部失败 → null
 */
export function calculateLine(text: string): LineResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return { result: null, text: "" };
  }

  // 预处理：中文大数单位 万/亿 → 乘法
  // "1万" → "10000", "3.5亿" → "350000000", "2万5" → "25000"
  const expanded = expandChineseMagnitude(trimmed);

  // 第1级：表达式求值（四则运算 + 括号）
  try {
    const value = parser.parse(expanded).evaluate();
    if (typeof value === "number" && !isNaN(value) && isFinite(value)) {
      // -0 → 0
      const normalized = value === 0 ? 0 : value;
      return { result: normalized, text: formatNumber(normalized, formatOptions.decimals, formatOptions.thousands) };
    }
  } catch {
    // 表达式解析失败，继续走语义规则
  }

  // 第2级：语义规则引擎（用 expanded 替换后的文本）
  for (const rule of rules) {
    const result = rule.match(expanded);
    if (result !== null) {
      return result;
    }
  }

  return { result: null, text: "" };
}

/**
 * 中文大数单位展开：
 * - "万" = ×10000，"亿" = ×100000000
 * - 支持整数和小数前缀：1万、3.5亿、0.5万
 * - 支持尾数：2万5 = 25000、3亿5 = 350000000
 * - 多个单位：1亿2千万 = 120000000
 */
function expandChineseMagnitude(text: string): string {
  // 先处理 "亿"，再处理 "万"（从大到小）
  let result = text;
  // 数字 + 亿 + 可选尾数 → (数字 * 100000000 + 尾数)
  result = result.replace(/(\d[\d,]*\.?\d*)\s*亿\s*(\d[\d,]*\.?\d*)?/g, (_, num, suffix) => {
    const base = parseFloat(num.replace(/,/g, "")) * 1e8;
    return suffix ? String(base + parseFloat(suffix.replace(/,/g, "")) * 1e7) : String(base);
  });
  result = result.replace(/(\d[\d,]*\.?\d*)\s*亿/g, (_, num) => String(parseFloat(num.replace(/,/g, "")) * 1e8));

  // 数字 + 万 + 可选尾数 → (数字 * 10000 + 尾数)
  result = result.replace(/(\d[\d,]*\.?\d*)\s*万\s*(\d[\d,]*\.?\d*)?/g, (_, num, suffix) => {
    const base = parseFloat(num.replace(/,/g, "")) * 1e4;
    return suffix ? String(base + parseFloat(suffix.replace(/,/g, "")) * 1e3) : String(base);
  });
  result = result.replace(/(\d[\d,]*\.?\d*)\s*万/g, (_, num) => String(parseFloat(num.replace(/,/g, "")) * 1e4));

  return result;
}

/**
 * 格式化数字显示
 * - 整数直接显示，可选千分位
 * - 小数按 decimals 保留位数，去掉末尾多余的 0
 *
 * 不传参数时使用全局格式化上下文（由 setFormatOptions 设置）。
 *
 * @param value 数值
 * @param decimals 小数位数（省略则用全局设置）
 * @param thousands 是否千分位分隔（省略则用全局设置）
 */
export function formatNumber(
  value: number,
  decimals?: number,
  thousands?: boolean,
): string {
  const dec = decimals ?? formatOptions.decimals;
  const sep = thousands ?? formatOptions.thousands;

  if (value === 0) {
    return "0";
  }
  if (Number.isInteger(value)) {
    return sep ? value.toLocaleString("en-US") : String(value);
  }

  const factor = Math.pow(10, dec);
  const rounded = Math.round(value * factor) / factor;
  const str = rounded.toFixed(dec).replace(/\.?0+$/, "");
  const parts = str.split(".");
  parts[0] = sep ? Number(parts[0]).toLocaleString("en-US") : parts[0];
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
