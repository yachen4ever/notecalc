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
 *   "1天 - 10小时"       → 0.58 天（减法运算）
 *   "1km 500m 20cm"      → 1.5 km（可切换 m/cm/mm）
 *   "2小时30分钟"         → 2.5 小时（可切换 分钟/秒）
 *   "1小时"              → 1 小时（可切换 分钟/秒/天）  ← 单单位也触发
 *   "3h24m"              → 3.4 小时（紧凑时间格式，可切换 分钟/秒/天）
 *   "1d2h30m"            → 1.104 天（紧凑时间格式）
 *   "90min"              → 90 分钟（紧凑时间格式）
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

    // 优先尝试紧凑时间格式（3h24m、1d2h30m、90min）：
    // 这些格式中 "m" 应解释为分钟而非米，且数字与单位之间无空格，
    // 通用 extractUnitPairs 会把 "24m" 的 m 误匹配为长度单位米
    const compact = matchCompactTime(text);
    if (compact) return compact;

    // 提取所有 "数字+单位" 组合
    const matches = extractUnitPairs(text);
    if (matches.length < 1) return null;

    // 检查所有单位是否属于同一类别
    const categories = new Set(matches.map((m) => m.unit.category));
    if (categories.size !== 1) return null;

    const category = matches[0].unit.category;
    // 温度不支持复合（30摄氏度 没有切换意义）
    if (category === "temperature") return null;

    // 归一化为基准值（含符号）
    let baseValue = 0;
    for (const { value, unit, sign } of matches) {
      if (unit.toBase) {
        baseValue += sign * unit.toBase(value);
      } else {
        baseValue += sign * value * unit.factor;
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
 * 从文本中提取所有 "数字+单位" 的组合，含运算符（+/-）
 * 匹配：数字 + 可选空格 + 单位名，支持 +/- 号分隔
 *
 * 运算符逻辑：
 *   - 第一个数字+单位默认为正（前面无运算符或有 +）
 *   - 后续数字+单位前如果有 - 号则为负，否则为正
 *   - + 号和空格都是默认加法
 *   - 支持连续写法："1天-10小时"、"1kg - 200g"、"1天 2小时"
 *
 * 由于单位名可能包含数字（如 km2、m2），不能简单用正则匹配单位名。
 * 改为：先匹配数字，再从 unitMap 中按名称长度降序尝试匹配。
 */
function extractUnitPairs(text: string): { value: number; unit: UnitDef; sign: 1 | -1 }[] {
  // 记录每个数字+单位对前面的运算符位置，用于判断 sign
  const sortedNames = [...unitMap.entries()].sort((a, b) => b[0].length - a[0].length);

  const pairs: { value: number; unit: UnitDef; sign: 1 | -1 }[] = [];
  // 匹配数字（含千分位逗号和小数）
  const numRegex = /\d[\d,]*\.?\d*/g;
  let match: RegExpExecArray | null;
  let prevMatchEnd = 0; // 上一个已消耗的字符位置

  while ((match = numRegex.exec(text)) !== null) {
    const value = parseNumber(match[0]);
    if (value === null) continue;

    // 从数字后面开始尝试匹配单位名
    const afterNum = text.slice(match.index + match[0].length);
    // 跳过空格
    const trimmedAfter = afterNum.replace(/^\s*/, "");

    let matched = false;
    for (const [name, unit] of sortedNames) {
      if (trimmedAfter.toLowerCase().startsWith(name)) {
        // 检查这个数字前面的文本中是否有 - 号（在上一个已消耗位置之后）
        const between = text.slice(prevMatchEnd, match.index);
        const sign: 1 | -1 = /-/.test(between) ? -1 : 1;
        pairs.push({ value, unit, sign });
        // 跳过已匹配的部分（数字 + 空格 + 单位名）
        const consumed = match[0].length + (afterNum.length - trimmedAfter.length) + name.length;
        prevMatchEnd = match.index + consumed;
        numRegex.lastIndex = prevMatchEnd;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // 这个数字没有跟单位，跳过
    }
  }

  return pairs;
}

/**
 * 紧凑时间格式解析（3h24m / 1d2h30m / 90min / 45s）
 *
 * 时间单位的紧凑写法很常见（如 "3h24m" 表示 3 小时 24 分），
 * 但由于 "m" 在长度单位中代表米，通用 extractUnitPairs 无法正确处理。
 * 这里用独立正则解析，仅当整个文本都是 "数字+时间单位缩写" 的连续串时触发。
 *
 * 支持的时间单位缩写：
 *   d / day / days / 天     → 天
 *   h / hr / hrs / 时       → 小时
 *   min / mins / m / 分     → 分钟（m 仅在紧凑时间串内解释为分钟）
 *   s / sec / 秒            → 秒
 *
 * 规则：
 *   - 文本必须整体匹配（^...$），避免误伤普通文本（如 "5km" 不触发）
 *   - 至少需要 1 个 数字+单位 对
 *   - 允许 + / - / 空格 作为分隔符
 *   - 支持小数：3.5h = 3.5 小时
 */
function matchCompactTime(text: string): LineResult | null {
  const trimmed = text.trim();

  // 单段：数字 + 可选空格 + 时间单位
  const seg = "(\\d[\\d,]*\\.?\\d*)\\s*(d|day|days|天|h|hr|hrs|时|min|mins|m|分|s|sec|秒)";
  // 整个文本必须是 段 的连续串（可带 + / - / 空格）
  const fullRegex = new RegExp(`^(?:\\s*(?:[+\\-]\\s*)?${seg})+$`, "i");
  if (!fullRegex.test(trimmed)) return null;

  // 逐段解析，计算总秒数 + 输入中出现的最大时间单位
  const segRegex = new RegExp(seg, "gi");
  let totalSeconds = 0;
  let maxFactor = 0;
  let hasSegment = false;
  let prevEnd = 0; // 上一个已消耗段的结束位置（用于判断负号）
  let m: RegExpExecArray | null;

  const factorByUnit: Record<string, number> = {
    d: 86400,
    day: 86400,
    days: 86400,
    天: 86400,
    h: 3600,
    hr: 3600,
    hrs: 3600,
    时: 3600,
    min: 60,
    mins: 60,
    m: 60,
    分: 60,
    s: 1,
    sec: 1,
    秒: 1,
  };

  while ((m = segRegex.exec(trimmed)) !== null) {
    const value = parseNumber(m[1]);
    if (value === null) continue;
    const u = m[2].toLowerCase();
    const factor = factorByUnit[u];
    if (!factor) continue;
    // 检查段前是否有负号（在上一个段结束之后、当前段开始之前）
    const segmentStart = m.index;
    const between = trimmed.slice(prevEnd, segmentStart);
    const sign = /-/.test(between) ? -1 : 1;
    totalSeconds += sign * value * factor;
    maxFactor = Math.max(maxFactor, factor);
    hasSegment = true;
    prevEnd = m.index + m[0].length;
  }

  if (!hasSegment) return null;

  // 归一化为秒（基准）
  const baseValue = totalSeconds;

  // 构建可切换单位列表
  const categoryUnits = getUnitsByCategory("time");
  const unitOptions: UnitOption[] = categoryUnits.map((u) => ({
    label: getUnitLabel(u),
    factor: u.factor,
    fromBase: u.fromBase,
  }));

  // 默认单位取输入中最大的单位
  const defaultUnitIndex = Math.max(
    0,
    unitOptions.findIndex((u) => u.factor === maxFactor)
  );

  const defaultUnit = unitOptions[defaultUnitIndex];
  const displayValue = defaultUnit.fromBase
    ? defaultUnit.fromBase(baseValue)
    : baseValue / defaultUnit.factor;

  const unitInfo: UnitInfo = {
    category: "time",
    baseValue,
    units: unitOptions,
    defaultUnitIndex,
  };

  return {
    result: baseValue,
    text: `${formatNumber(displayValue)} ${defaultUnit.label}`,
    unitInfo,
  };
}
