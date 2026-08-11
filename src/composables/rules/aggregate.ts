import type { LineResult } from "../../types";
import type { SemanticRule } from "./engine";
import { formatNumber } from "../useCalculator";
import { extractNumbers } from "./engine";

/**
 * 聚合规则：平均/最大/最小/总和
 *
 * 匹配：
 * - "平均" / "平均值" / "avg" / "average"
 * - "最大" / "最大值" / "max" / "maximum"
 * - "最小" / "最小值" / "min" / "minimum"
 * - "总和" / "总计" / "sum" / "total"
 *
 * 语义：从输入文本中提取所有数字，执行聚合运算
 * 适用于 "平均 100 200 300" / "最大 34 56 78" / "sum 10 20 30"
 *
 * 注意：如果行中出现 l1/line2 等行引用，它们已被 useVariables 替换为具体数值
 */
export const aggregateRule: SemanticRule = {
  name: "aggregate",

  match(text: string): LineResult | null {
    const trimmed = text.trim();

    // 不匹配赋值语句
    if (/^[\u4e00-\u9fa5a-zA-Z_][\w\u4e00-\u9fa5]*\s*=/.test(trimmed)) return null;

    // \b 在中文后不生效，改用 (?=\s|$|\d) 确保关键词后面是空白/数字/行尾
    const m = trimmed.match(
      /^(平均|平均值|avg|average|最大|最大值|max|maximum|最小|最小值|min|minimum|总和|总计|sum|total)(?=\s|$|\d)\s*(.*)/i,
    );
    if (!m) return null;

    const keyword = m[1].toLowerCase();
    const rest = m[2].trim();

    // 从整个文本中提取数字（包含关键词后面的部分）
    const numbers = extractNumbers(rest);
    if (numbers.length === 0) return null;

    let result: number;
    const kw = keyword.replace(/值/, "");

    if (kw === "平均" || kw === "avg" || kw === "average") {
      result = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    } else if (kw === "最大" || kw === "max" || kw === "maximum") {
      result = Math.max(...numbers);
    } else if (kw === "最小" || kw === "min" || kw === "minimum") {
      result = Math.min(...numbers);
    } else {
      // 总和 / 总计 / sum / total
      result = numbers.reduce((a, b) => a + b, 0);
    }

    return { result, text: formatNumber(result) };
  },
};
