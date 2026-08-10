import type { LineResult } from "../../types";

/**
 * 语义规则接口
 * 每条规则尝试匹配一行文本，匹配成功返回计算结果，不匹配返回 null
 */
export interface SemanticRule {
  /** 规则名称（调试用） */
  name: string;
  /** 尝试匹配文本，返回结果或 null */
  match(text: string): LineResult | null;
}

/**
 * 安全数字解析：支持千分位逗号
 */
export function parseNumber(s: string): number | null {
  const cleaned = s.replace(/,/g, "").trim();
  if (cleaned === "" || isNaN(Number(cleaned))) return null;
  const n = Number(cleaned);
  return isFinite(n) ? n : null;
}

/**
 * 从文本中提取所有数字（含千分位逗号）
 */
export function extractNumbers(text: string): number[] {
  const matches = text.match(/\d[\d,]*\.?\d*/g);
  if (!matches) return [];
  return matches
    .map((s) => parseNumber(s))
    .filter((n): n is number => n !== null);
}

/**
 * 所有已注册的语义规则，按优先级排序
 * calculateLine 会在 mathjs 表达式失败后依次尝试
 */
export const rules: SemanticRule[] = [];

/**
 * 注册规则
 */
export function registerRule(rule: SemanticRule) {
  rules.push(rule);
}
