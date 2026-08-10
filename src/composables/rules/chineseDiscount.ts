import type { SemanticRule } from "./engine";
import { parseNumber } from "./engine";
import { formatNumber } from "../useCalculator";
import type { LineResult } from "../../types";

/**
 * 规则2：中文折扣/百分比
 *
 * 支持的中文写法：
 *   "打8折" / "打 8 折"    → 金额 × 0.8
 *   "8折"                  → 金额 × 0.8
 *   "9.5折"               → 金额 × 0.95
 *   "半价"                 → 金额 × 0.5
 *   "满200减50"            → 200 - 50 = 150
 *   "涨10%" / "涨 10%"     → 金额 × 1.1
 *   "降10%" / "降 10%"     → 金额 × 0.9
 *
 * 需要同时有金额和折扣词才能匹配
 */
export const chineseDiscountRule: SemanticRule = {
  name: "chinese-discount",

  match(text: string): LineResult | null {
    // === 打折 ===
    // "打8折" / "打 8 折" / "8折" / "9.5折"
    const discountMatch = text.match(/(?:打\s*)?(\d+\.?\d*)\s*折/);
    if (discountMatch) {
      // 折扣值：8折 = 0.8, 9.5折 = 0.95
      const discountValue = parseNumber(discountMatch[1]);
      if (discountValue === null) return null;

      // 折扣数应在 0~10 之间（8折=0.8, 9.5折=0.95）
      if (discountValue <= 0 || discountValue > 10) return null;

      const rate = discountValue / 10;

      // 找文本中的其他数字作为原价
      // 移除折扣部分后提取剩余数字
      const remaining = text.replace(discountMatch[0], "");
      const otherNumbers = remaining.match(/\d[\d,]*\.?\d*/g);

      if (otherNumbers && otherNumbers.length > 0) {
        // 取第一个数字作为原价
        const originalPrice = parseNumber(otherNumbers[0]);
        if (originalPrice !== null) {
          const result = originalPrice * rate;
          return { result, text: formatNumber(result) };
        }
      }

      // 没有原价，只返回折扣率（如 "8折" → 0.8）
      return { result: rate, text: formatNumber(rate) };
    }

    // === 半价 ===
    if (/半价/.test(text)) {
      const remaining = text.replace(/半价/, "");
      const otherNumbers = remaining.match(/\d[\d,]*\.?\d*/g);
      if (otherNumbers && otherNumbers.length > 0) {
        const originalPrice = parseNumber(otherNumbers[0]);
        if (originalPrice !== null) {
          const result = originalPrice * 0.5;
          return { result, text: formatNumber(result) };
        }
      }
      return { result: 0.5, text: formatNumber(0.5) };
    }

    // === 满 X 减 Y ===
    const manJianMatch = text.match(/满\s*(\d[\d,]*\.?\d*)\s*减\s*(\d[\d,]*\.?\d*)/);
    if (manJianMatch) {
      const total = parseNumber(manJianMatch[1]);
      const discount = parseNumber(manJianMatch[2]);
      if (total !== null && discount !== null) {
        const result = total - discount;
        return { result, text: formatNumber(result) };
      }
    }

    // === 涨/降 N% ===
    const upDownMatch = text.match(/(涨|降)\s*(\d+\.?\d*)\s*%/);
    if (upDownMatch) {
      const direction = upDownMatch[1];
      const percent = parseNumber(upDownMatch[2]);
      if (percent === null) return null;

      const rate = direction === "涨" ? 1 + percent / 100 : 1 - percent / 100;

      // 找原价
      const remaining = text.replace(upDownMatch[0], "");
      const otherNumbers = remaining.match(/\d[\d,]*\.?\d*/g);
      if (otherNumbers && otherNumbers.length > 0) {
        const originalPrice = parseNumber(otherNumbers[0]);
        if (originalPrice !== null) {
          const result = originalPrice * rate;
          return { result, text: formatNumber(result) };
        }
      }

      return { result: rate, text: formatNumber(rate) };
    }

    return null;
  },
};
