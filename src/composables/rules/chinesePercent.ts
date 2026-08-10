import type { SemanticRule } from "./engine";
import { parseNumber } from "./engine";
import { formatNumber } from "../useCalculator";
import type { LineResult } from "../../types";

/**
 * 规则4：中文百分比运算
 *
 * 支持的写法：
 *   "120的15%"           → 120 × 0.15 = 18
 *   "120 的 15%"         → 18
 *   "120占800的百分比"    → 120 / 800 × 100 = 15
 *   "120是800的百分之几"  → 15
 *   "120的百分之15"       → 18
 *
 * 注：英文 "10% of 200" 由 englishPercent 规则处理
 */
export const chinesePercentRule: SemanticRule = {
  name: "chinese-percent",

  match(text: string): LineResult | null {
    // === X占Y的百分比 / X是Y的百分之几 ===
    // "120占800的百分比" → 120/800×100 = 15
    // "120是800的百分之几" → 15
    const ratioMatch = text.match(
      /(\d[\d,]*\.?\d*)\s*(占|是)\s*(\d[\d,]*\.?\d*)\s*的\s*(?:百分比|百分之几)/
    );
    if (ratioMatch) {
      const part = parseNumber(ratioMatch[1]);
      const whole = parseNumber(ratioMatch[3]);
      if (part !== null && whole !== null && whole !== 0) {
        const result = (part / whole) * 100;
        return { result, text: formatNumber(result) };
      }
    }

    // === X的百分之Y ===
    // "120的百分之15" → 120 × 0.15 = 18
    const percentOfMatch = text.match(
      /(\d[\d,]*\.?\d*)\s*的\s*百分之\s*(\d+\.?\d*)/
    );
    if (percentOfMatch) {
      const base = parseNumber(percentOfMatch[1]);
      const percent = parseNumber(percentOfMatch[2]);
      if (base !== null && percent !== null) {
        const result = base * (percent / 100);
        return { result, text: formatNumber(result) };
      }
    }

    // === X的Y% ===
    // "120的15%" → 18
    // 注意：要排除已被其他规则处理的 "涨10%" "降10%" 等
    const basePercentMatch = text.match(
      /(\d[\d,]*\.?\d*)\s*的\s*(\d+\.?\d*)\s*%/
    );
    if (basePercentMatch) {
      const base = parseNumber(basePercentMatch[1]);
      const percent = parseNumber(basePercentMatch[2]);
      if (base !== null && percent !== null) {
        const result = base * (percent / 100);
        return { result, text: formatNumber(result) };
      }
    }

    return null;
  },
};
