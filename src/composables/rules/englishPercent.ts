import type { SemanticRule } from "./engine";
import { parseNumber } from "./engine";
import { formatNumber } from "../useCalculator";
import type { LineResult } from "../../types";

/**
 * 规则3：英文百分比/折扣
 *
 * 支持的英文写法：
 *   "10% off 200"         → 200 × 0.9 = 180
 *   "200 with 10% off"    → 180
 *   "10% of 200"          → 200 × 0.1 = 20
 *   "200 + 10%"           → 220 (加 10%)
 *   "200 - 10%"           → 180 (减 10%)
 *
 * 注：mathjs 已支持部分百分比写法，这里补充自然语言形式
 */
export const englishPercentRule: SemanticRule = {
  name: "english-percent",

  match(text: string): LineResult | null {
    // === X% off Y ===
    // "10% off 200" → 200 × (1 - 0.1) = 180
    const offMatch = text.match(/(\d+\.?\d*)\s*%\s*off\s+(\d[\d,]*\.?\d*)/i);
    if (offMatch) {
      const percent = parseNumber(offMatch[1]);
      const price = parseNumber(offMatch[2]);
      if (percent !== null && price !== null) {
        const result = price * (1 - percent / 100);
        return { result, text: formatNumber(result) };
      }
    }

    // === Y with X% off ===
    // "200 with 10% off" → 180
    const withOffMatch = text.match(/(\d[\d,]*\.?\d*)\s+with\s+(\d+\.?\d*)\s*%\s*off/i);
    if (withOffMatch) {
      const price = parseNumber(withOffMatch[1]);
      const percent = parseNumber(withOffMatch[2]);
      if (price !== null && percent !== null) {
        const result = price * (1 - percent / 100);
        return { result, text: formatNumber(result) };
      }
    }

    // === X% of Y ===
    // "10% of 200" → 20
    const ofMatch = text.match(/(\d+\.?\d*)\s*%\s*of\s+(\d[\d,]*\.?\d*)/i);
    if (ofMatch) {
      const percent = parseNumber(ofMatch[1]);
      const price = parseNumber(ofMatch[2]);
      if (percent !== null && price !== null) {
        const result = price * (percent / 100);
        return { result, text: formatNumber(result) };
      }
    }

    // === Y + X% / Y - X% ===
    // "200 + 10%" → 220, "200 - 10%" → 180
    // (mathjs 不支持这种写法，需要自定义处理)
    const arithPercentMatch = text.match(/(\d[\d,]*\.?\d*)\s*([+\-])\s*(\d+\.?\d*)\s*%/);
    if (arithPercentMatch) {
      const price = parseNumber(arithPercentMatch[1]);
      const op = arithPercentMatch[2];
      const percent = parseNumber(arithPercentMatch[3]);
      if (price !== null && percent !== null) {
        const amount = price * (percent / 100);
        const result = op === "+" ? price + amount : price - amount;
        return { result, text: formatNumber(result) };
      }
    }

    return null;
  },
};
