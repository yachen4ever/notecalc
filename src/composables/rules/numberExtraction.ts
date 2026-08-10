import type { SemanticRule } from "./engine";
import { extractNumbers } from "./engine";
import { formatNumber } from "../useCalculator";
import type { LineResult } from "../../types";

/**
 * 规则1：数字提取求和
 *
 * 当文本不是合法表达式（mathjs 失败），但包含多个数字时，
 * 提取所有数字求和。
 *
 * 示例：
 *   "餐饮340 打车86"     → 426
 *   "午餐 25 晚餐 58"     → 83
 *   "工资 8000 房租 2500" → 10500
 *   "苹果 5块钱 橘子 3块" → 8
 *
 * 如果只有一个数字，也返回它（纯数字行本该被 mathjs 处理，
 * 但带文字的单数字如 "收入 5000" 也要能识别）
 */
export const numberExtractionRule: SemanticRule = {
  name: "number-extraction",

  match(text: string): LineResult | null {
    const numbers = extractNumbers(text);

    if (numbers.length === 0) return null;

    // 单个数字：只要文本不是纯数字（纯数字已被 mathjs 处理到这里不会到）
    // 带文字的单数字也提取，如 "收入 5000"
    // 多个数字：求和
    const sum = numbers.reduce((a, b) => a + b, 0);
    return { result: sum, text: formatNumber(sum) };
  },
};
