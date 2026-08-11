import type { SemanticRule } from "./engine";
import { extractNumbers } from "./engine";
import { formatNumber } from "../useCalculator";
import type { LineResult } from "../../types";

/**
 * 规则6（兜底）：数字提取求和
 *
 * 当文本不是合法表达式，但包含多个数字时，提取所有数字求和。
 * 适用场景：记事本记账
 *   "餐饮340 打车86"     → 426
 *   "午餐 25 晚餐 58"     → 83
 *
 * 排除场景：文本含语义关键词（比/少/多/平均/次方/平方根等）时，
 * 说明用户意图不是简单记账，前面的规则未能匹配说明输入格式不完整，
 * 此时不兜底求和，避免给出误导性结果。
 */
export const numberExtractionRule: SemanticRule = {
  name: "number-extraction",

  match(text: string): LineResult | null {
    const numbers = extractNumbers(text);

    if (numbers.length === 0) return null;

    // 语义关键词黑名单：这些词意味着用户意图不是简单记账
    const SEMANTIC_KEYWORDS = [
      "比", "少", "多",         // "比100少20%" 等
      "平均",                     // "100和200的平均"
      "次方", "平方根", "开方",   // 数学运算
      "百分之",                   // 中文百分比
      "占",                       // 占比
      "折",                       // 折扣
      "折后",                     // 折后价
      "满", "减",                 // 满减
    ];
    for (const kw of SEMANTIC_KEYWORDS) {
      if (text.includes(kw)) return null;
    }

    // 单个数字：只要文本不是纯数字（纯数字已被表达式处理）
    // 带文字的单数字也提取，如 "收入 5000"
    // 多个数字：求和
    const sum = numbers.reduce((a, b) => a + b, 0);
    return { result: sum, text: formatNumber(sum) };
  },
};
