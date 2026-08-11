import type { SemanticRule } from "./engine";
import { parseNumber } from "./engine";
import { formatNumber } from "../useCalculator";
import { getUnitsByCategory, getUnitLabel, unitMap, type UnitDef } from "./unitConversion";
import type { LineResult, UnitInfo, UnitOption } from "../../types";

/**
 * 规则6：复合单位归一化
 *
 * 支持的写法：
 *   "1天20小时48分钟"     → 1.87 天（可切换 小时/分钟/秒）
 *   "1kg + 200g"         → 1.2 kg（可切换 g/mg/吨）
 *   "1km 500m 20cm"      → 1.5 km（可切换 m/cm/mm）
 *   "2小时30分钟"         → 2.5 小时（可切换 分钟/秒）
 *   "1小时"              → 1 小时（可切换 分钟/秒/天）  ← 单单位也触发
 *
 * 判断逻辑：
 *   - 输入中没有转换关键词（to/转/等于多少）→ 否则交给 unitConversionRule 处理
 *   - 文本中包含 1 个或以上 "数字+同类单位" 的组合 → 复合单位
 *   - 所有单位必须属于同一类别
 *   - 温度不支持（30摄氏度 没有切换意义，交给 unitConversionRule）
 */
export const compoundUnitRule: SemanticRule = {
  name: "compound-unit",

  match(text: string): LineResult | null {
    // 如果包含转换关键词，交给 unitConversionRule
    if (/to|转|换算|等于多少|是多少|合多少/i.test(text)) return null;

    // 提取所有 "数字+单位" 组合
    const matches = extractUnitPairs(text);
    if (matches.length < 1) return null;

    // 检查所有单位是否属于同一类别
    const categories = new Set(matches.map((m) => m.unit.category));
    if (categories.size !== 1) return null;

    const category = matches[0].unit.category;
    // 温度不支持复合（30摄氏度 没有切换意义）
    if (category === "temperature") return null;

    // 归一化为基准值
    let baseValue = 0;
    for (const { value, unit } of matches) {
      if (unit.toBase) {
        baseValue += unit.toBase(value);
      } else {
        baseValue += value * unit.factor;
      }
    }

    // 构建可切换单位列表（从大到小）
    const categoryUnits = getUnitsByCategory(category);
    const unitOptions: UnitOption[] = categoryUnits.map((u) => ({
      label: getUnitLabel(u),
      factor: u.factor,
      fromBase: u.fromBase,
    }));

    // 找到输入中最大的单位对应的索引
    const maxFactor = Math.max(...matches.map((m) => m.unit.factor));
    const defaultUnitIndex = Math.max(
      0,
      unitOptions.findIndex((u) => u.factor === maxFactor)
    );

    // 用默认单位计算展示值
    const defaultUnit = unitOptions[defaultUnitIndex];
    const displayValue = defaultUnit.fromBase
      ? defaultUnit.fromBase(baseValue)
      : baseValue / defaultUnit.factor;

    // 构造 unitInfo
    const unitInfo: UnitInfo = {
      category,
      baseValue,
      units: unitOptions,
      defaultUnitIndex,
    };

    // result 是归一化的基准值（用于汇总）
    // text 是默认单位下的展示文本
    return {
      result: baseValue,
      text: `${formatNumber(displayValue)} ${defaultUnit.label}`,
      unitInfo,
    };
  },
};

/**
 * 从文本中提取所有 "数字+单位" 的组合
 * 匹配：数字 + 可选空格 + 单位名，支持 + 号分隔
 *
 * 由于单位名可能包含数字（如 km2、m2），不能简单用正则匹配单位名。
 * 改为：先匹配数字，再从 unitMap 中按名称长度降序尝试匹配。
 */
function extractUnitPairs(text: string): { value: number; unit: UnitDef }[] {
  // 去掉 + 号两边的空格，统一处理
  const cleaned = text.replace(/\s*\+\s*/g, " ");

  // 按名称长度降序排列，优先匹配更长的单位名（如 "千米" 优先于 "米"）
  const sortedNames = [...unitMap.entries()].sort((a, b) => b[0].length - a[0].length);

  const pairs: { value: number; unit: UnitDef }[] = [];
  // 匹配数字（含千分位逗号和小数）
  const numRegex = /\d[\d,]*\.?\d*/g;
  let match: RegExpExecArray | null;

  while ((match = numRegex.exec(cleaned)) !== null) {
    const value = parseNumber(match[0]);
    if (value === null) continue;

    // 从数字后面开始尝试匹配单位名
    const afterNum = cleaned.slice(match.index + match[0].length);
    // 跳过空格
    const trimmedAfter = afterNum.replace(/^\s*/, "");

    for (const [name, unit] of sortedNames) {
      if (trimmedAfter.toLowerCase().startsWith(name)) {
        pairs.push({ value, unit });
        // 跳过已匹配的部分（数字 + 空格 + 单位名）
        const consumed = match[0].length + (afterNum.length - trimmedAfter.length) + name.length;
        numRegex.lastIndex = match.index + consumed;
        break;
      }
    }
  }

  return pairs;
}
