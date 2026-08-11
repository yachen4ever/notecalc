import type { SemanticRule } from "./engine";
import { parseNumber } from "./engine";
import { formatNumber } from "../useCalculator";
import type { LineResult } from "../../types";

/**
 * 单位定义
 */
interface UnitDef {
  /** 单位名称（含别名） */
  names: string[];
  /** 转换为基准单位的系数（value × factor = baseValue） */
  factor: number;
  /** 所属类别（同类别才能互转） */
  category: string;
  /**
   * 特殊转换函数（温度需要，因为不是线性比例）
   * 如果提供，toBase 和 fromBase 优先使用
   */
  toBase?: (v: number) => number;
  fromBase?: (v: number) => number;
}

/**
 * 单位注册表
 *
 * 基准单位选择：
 *   长度 → 米 (m)
 *   重量 → 克 (g)
 *   温度 → 摄氏度 (°C)
 *   面积 → 平方米 (m²)
 *   体积 → 升 (L)
 *   时间 → 秒 (s)
 *   数据 → 字节 (B)
 */
const units: UnitDef[] = [
  // ===== 长度（基准：米） =====
  { names: ["km", "千米", "公里"], factor: 1000, category: "length" },
  { names: ["m", "米"], factor: 1, category: "length" },
  { names: ["dm", "分米"], factor: 0.1, category: "length" },
  { names: ["cm", "厘米", "公分"], factor: 0.01, category: "length" },
  { names: ["mm", "毫米"], factor: 0.001, category: "length" },
  { names: ["mi", "mile", "miles", "英里"], factor: 1609.344, category: "length" },
  { names: ["ft", "feet", "foot", "英尺"], factor: 0.3048, category: "length" },
  { names: ["in", "inch", "inches", "英寸"], factor: 0.0254, category: "length" },
  { names: ["yd", "yard", "yards", "码"], factor: 0.9144, category: "length" },
  { names: ["里", "市里"], factor: 500, category: "length" },
  { names: ["丈"], factor: 10 / 3, category: "length" },
  { names: ["尺", "市尺"], factor: 1 / 3, category: "length" },
  { names: ["寸"], factor: 1 / 30, category: "length" },
  { names: ["海里", "nmi"], factor: 1852, category: "length" },

  // ===== 重量（基准：克） =====
  { names: ["t", "吨", "公吨"], factor: 1_000_000, category: "weight" },
  { names: ["kg", "千克", "公斤"], factor: 1000, category: "weight" },
  { names: ["g", "克"], factor: 1, category: "weight" },
  { names: ["mg", "毫克"], factor: 0.001, category: "weight" },
  { names: ["lb", "lbs", "pound", "pounds", "磅"], factor: 453.592, category: "weight" },
  { names: ["oz", "ounce", "盎司"], factor: 28.3495, category: "weight" },
  { names: ["斤", "市斤"], factor: 500, category: "weight" },
  { names: ["两"], factor: 50, category: "weight" },
  { names: ["钱"], factor: 5, category: "weight" },

  // ===== 温度（基准：摄氏度，特殊转换） =====
  {
    names: ["c", "°c", "摄氏度", "摄氏"],
    factor: 1,
    category: "temperature",
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  {
    names: ["f", "°f", "华氏度", "华氏"],
    factor: 1,
    category: "temperature",
    toBase: (v) => (v - 32) / 1.8,
    fromBase: (v) => v * 1.8 + 32,
  },
  {
    names: ["k", "开尔文", "kelvin"],
    factor: 1,
    category: "temperature",
    toBase: (v) => v - 273.15,
    fromBase: (v) => v + 273.15,
  },

  // ===== 面积（基准：平方米） =====
  { names: ["km2", "km²", "平方千米", "平方公里"], factor: 1_000_000, category: "area" },
  { names: ["m2", "m²", "平方米", "平米"], factor: 1, category: "area" },
  { names: ["cm2", "cm²", "平方厘米"], factor: 0.0001, category: "area" },
  { names: ["ha", "公顷"], factor: 10_000, category: "area" },
  { names: ["亩", "市亩"], factor: 666.667, category: "area" },
  { names: ["acre", "acres", "英亩"], factor: 4046.86, category: "area" },
  { names: ["ft2", "ft²", "平方英尺"], factor: 0.092903, category: "area" },

  // ===== 体积（基准：升） =====
  { names: ["l", "L", "升", "公升"], factor: 1, category: "volume" },
  { names: ["ml", "mL", "毫升"], factor: 0.001, category: "volume" },
  { names: ["gal", "gallon", "加仑"], factor: 3.78541, category: "volume" },
  { names: ["cup", "杯"], factor: 0.236588, category: "volume" },

  // ===== 时间（基准：秒） =====
  { names: ["ms", "毫秒"], factor: 0.001, category: "time" },
  { names: ["s", "sec", "秒"], factor: 1, category: "time" },
  { names: ["min", "mins", "分钟", "分"], factor: 60, category: "time" },
  { names: ["h", "hr", "hrs", "小时", "时"], factor: 3600, category: "time" },
  { names: ["day", "days", "天", "日"], factor: 86400, category: "time" },
];

// 构建名称到 UnitDef 的查找表
const unitMap = new Map<string, UnitDef>();
for (const u of units) {
  for (const name of u.names) {
    unitMap.set(name.toLowerCase(), u);
  }
}

/**
 * 从文本中解析源单位对（数字 + 单位）
 * 返回第一个匹配的 { value, unit }
 */
function parseSourceUnit(text: string): { value: number; unit: UnitDef } | null {
  // 匹配：数字 + 可选空格 + 单位
  const regex = /(\d[\d,]*\.?\d*)\s*([a-z°²0-9\u4e00-\u9fff]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const value = parseNumber(match[1]);
    const unitName = match[2].toLowerCase();
    const unit = unitMap.get(unitName);
    if (value !== null && unit) {
      return { value, unit };
    }
  }

  return null;
}

/**
 * 从文本中解析目标单位（不要求前面有数字）
 * 遍历单位表，按名称长度降序匹配（优先匹配更长的单位名，如 "千米" 优先于 "米"）
 */
function parseTargetUnit(text: string): UnitDef | null {
  // 按名称长度降序排列，避免短名称部分匹配
  const sortedNames = [...unitMap.entries()].sort((a, b) => b[0].length - a[0].length);
  const lower = text.toLowerCase();
  for (const [name, unit] of sortedNames) {
    // 用词边界检查，避免 "米" 匹配到 "千米" 的尾部
    const idx = lower.indexOf(name);
    if (idx >= 0) {
      // 检查前面一个字符不是字母/数字/中文（避免部分匹配）
      const prevChar = lower[idx - 1];
      if (prevChar && /[\w\u4e00-\u9fa5]/.test(prevChar)) continue;
      return unit;
    }
  }
  return null;
}

/**
 * 查找转换关键词
 */
function findConversionKeyword(text: string): string | null {
  const keywords = [
    "to",
    "转",
    "转换",
    "换算",
    "等于多少",
    "是多少",
    "合多少",
    "是多少",
  ];
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw)) return kw;
  }
  return null;
}

/**
 * 规则5：单位转换
 *
 * 支持的写法：
 *   "5km to mi"         → 3.107 mi
 *   "5km 转 mi"          → 3.107
 *   "30摄氏度转华氏"       → 86
 *   "100kg转斤"          → 200
 *   "1英里 等于多少 千米"   → 1.609
 *
 * 需要同时有：源数值+源单位、目标单位、转换关键词
 */
export const unitConversionRule: SemanticRule = {
  name: "unit-conversion",

  match(text: string): LineResult | null {
    const keyword = findConversionKeyword(text);
    if (!keyword) return null;

    const source = parseSourceUnit(text);
    if (!source) return null;

    // 目标单位：从转换关键词之后查找
    const kwIdx = text.toLowerCase().indexOf(keyword);
    const afterKeyword = text.slice(kwIdx + keyword.length);
    const target = parseTargetUnit(afterKeyword);
    if (!target) return null;

    // 源单位和目标单位必须同类别
    if (source.unit.category !== target.category) return null;

    // 转换
    let baseValue: number;
    if (source.unit.toBase) {
      baseValue = source.unit.toBase(source.value);
    } else {
      baseValue = source.value * source.unit.factor;
    }

    let result: number;
    if (target.fromBase) {
      result = target.fromBase(baseValue);
    } else {
      result = baseValue / target.factor;
    }

    return { result, text: formatNumber(result) };
  },
};
