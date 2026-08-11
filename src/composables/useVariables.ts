import type { Line, LineResult } from "../types";
import { calculateLine } from "./useCalculator";

/**
 * V4 变量引用 + 行间依赖
 *
 * 语法：
 * - l1 / line2   → 引用第 1/2 行的计算结果
 * - 单价 = 100   → 命名变量赋值，后续行可用 "单价" 引用
 * - 平均 / 最大 / 最小 → 聚合函数（由 aggregate 规则处理）
 *
 * 引用替换在 calculateLine 之前进行：把行文本中的变量标记替换为对应数值，
 * 然后走原有的多级管线计算。
 */

/**
 * 从文本中检测赋值语法（不计算值）
 * 如 "单价 = 100" → { name: "单价", rhs: "100" }
 * 如 "总价 = 单价 * 数量" → { name: "总价", rhs: "单价 * 数量" }
 */
export function parseAssignment(text: string): { name: string; rhs: string } | null {
  // \w 不匹配中文，需显式加 \u4e00-\u9fa5
  const m = text.match(/^([\u4e00-\u9fa5a-zA-Z_][\w\u4e00-\u9fa5]*)\s*=\s*(.+)$/);
  if (!m) return null;
  return { name: m[1].trim(), rhs: m[2].trim() };
}

/** 从文本中提取命名变量赋值（如 "单价 = 100" → { name: "单价", value: 100 }）
 *  注意：右侧如果引用了未定义的变量，会返回 null。赋值右侧引用变量的场景由 buildLineResults 处理。
 */
export function extractAssignment(text: string): { name: string; value: number } | null {
  const parsed = parseAssignment(text);
  if (!parsed) return null;

  const { result } = calculateLine(parsed.rhs);
  if (result === null) return null;

  return { name: parsed.name, value: result };
}

/** 检测行引用标记 l1 / line2 等，返回 { marker, lineIndex } */
const LINE_REF_RE = /(?:l|line)(\d+)/gi;

export interface LineRef {
  marker: string; // "l1" / "line2"
  lineIndex: number; // 0-based
}

export function findLineRefs(text: string): LineRef[] {
  const refs: LineRef[] = [];
  let m: RegExpExecArray | null;
  LINE_REF_RE.lastIndex = 0;
  while ((m = LINE_REF_RE.exec(text)) !== null) {
    refs.push({ marker: m[0], lineIndex: parseInt(m[1], 10) - 1 });
  }
  return refs;
}

/** 检测命名变量引用（中文/英文标识符），排除赋值语句左侧 */
const VAR_REF_RE = /(?<![\w\u4e00-\u9fa5=])([\u4e00-\u9fa5a-zA-Z_][\w\u4e00-\u9fa5]{0,20})(?![\w\u4e00-\u9fa5])/g;

export function findVarRefs(text: string): string[] {
  // 如果是赋值语句，去掉左侧
  const eqIdx = text.indexOf("=");
  const src = eqIdx >= 0 ? text.slice(eqIdx + 1) : text;

  const vars: string[] = [];
  let m: RegExpExecArray | null;
  VAR_REF_RE.lastIndex = 0;
  while ((m = VAR_REF_RE.exec(src)) !== null) {
    vars.push(m[1]);
  }
  return vars;
}

export interface LineComputeResult {
  result: number | null;
  text: string;
  /** 该行依赖哪些其他行（0-based），用于循环检测 */
  deps: number[];
  /** 该行是否为命名变量赋值 */
  assignment: { name: string; value: number } | null;
  /** 计算是否出错（如循环引用、引用不存在的行） */
  error?: string;
}

/**
 * 构建整个工作表的计算结果（含变量替换 + 依赖解析）
 *
 * 从上到下逐行计算，维护：
 * - lineValues: 每行的数值结果（用于 l1/line2 引用）
 * - namedVars: 命名变量表（用于 "单价" 引用）
 *
 * 对于每一行：
 * 1. 检测是否为赋值语句 → 提取变量名和值，记录到 namedVars
 * 2. 否则替换行引用（l1→行结果）和命名变量后，走 calculateLine
 * 3. 循环检测：如果 A 引用 B，B 又引用 A，标记 error
 */
export function buildLineResults(lines: Line[]): LineComputeResult[] {
  const results: LineComputeResult[] = new Array(lines.length);
  const lineValues: (number | null)[] = new Array(lines.length).fill(null);
  const namedVars = new Map<string, number>();
  const assignmentMap = new Map<number, string>(); // lineIndex → varName

  // 第一遍：检测所有赋值语句，构建命名变量表
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].text.trim();
    if (!text) {
      results[i] = { result: null, text: "", deps: [], assignment: null };
      continue;
    }

    const assignment = parseAssignment(text);
    if (assignment) {
      // 检测变量名与行引用格式冲突（l1/line2 等）
      if (/^(?:l|line)\d+$/i.test(assignment.name)) {
        results[i] = {
          result: null,
          text: "",
          deps: [],
          assignment: null,
          error: `变量名 "${assignment.name}" 与行引用格式冲突，请换一个名字`,
        };
        continue;
      }
      // 赋值语句：右侧可能也引用了之前的变量/行，需要先替换
      const { substituted, deps, error } = substitute(assignment.rhs, lineValues, namedVars, i);
      if (error) {
        results[i] = { result: null, text: "", deps, assignment: null, error };
        continue;
      }
      const { result, text: resultText } = calculateLine(substituted);
      results[i] = {
        result,
        text: result !== null ? `${assignment.name} = ${resultText}` : "",
        deps,
        assignment: result !== null ? { name: assignment.name, value: result } : null,
      };
      if (result !== null) {
        lineValues[i] = result;
        namedVars.set(assignment.name, result);
        assignmentMap.set(i, assignment.name);
      }
      continue;
    }

    // 非赋值行：先替换变量引用，再计算
    const { substituted, deps, error } = substitute(text, lineValues, namedVars, i);
    if (error) {
      results[i] = { result: null, text: "", deps, assignment: null, error };
      continue;
    }
    const { result, text: resultText } = calculateLine(substituted);
    results[i] = { result, text: resultText, deps, assignment: null };
    if (result !== null) {
      lineValues[i] = result;
    }
  }

  return results;
}

/** 变量替换：把行引用和命名变量替换为具体数值
 *  返回 { substituted, deps, error } —— error 非 null 时说明引用有问题
 */
function substitute(
  text: string,
  lineValues: (number | null)[],
  namedVars: Map<string, number>,
  currentIndex: number,
): { substituted: string; deps: number[]; error: string | null } {
  let result = text;
  const deps: number[] = [];

  // 1. 替换行引用 l1 / line2 等
  const refs = findLineRefs(text);
  for (const ref of refs) {
    if (ref.lineIndex === currentIndex) {
      return { substituted: text, deps, error: "自引用" };
    }
    if (ref.lineIndex < 0 || ref.lineIndex >= lineValues.length) {
      return { substituted: text, deps, error: `引用了不存在的行 l${ref.lineIndex + 1}` };
    }
    const val = lineValues[ref.lineIndex];
    if (val === null) {
      // 引用的行还没有结果（前向引用或空行/无效行）
      return { substituted: text, deps, error: `前向引用 l${ref.lineIndex + 1}（该行无有效结果）` };
    }
    result = result.replace(ref.marker, String(val));
    deps.push(ref.lineIndex);
  }

  // 2. 替换命名变量（排除赋值语句左侧——调用方已处理）
  const varRefs = findVarRefs(text);
  for (const varName of varRefs) {
    const val = namedVars.get(varName);
    if (val !== undefined) {
      // 用词边界替换，避免部分匹配
      const re = new RegExp(`(?<![\\w\\u4e00-\\u9fa5])${escapeRegExp(varName)}(?![\\w\\u4e00-\\u9fa5])`, "g");
      result = result.replace(re, String(val));
    }
  }

  return { substituted: result, deps, error: null };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 从 buildLineResults 提取纯 LineResult 数组（用于兼容旧接口）
 */
export function toLineResults(computeResults: LineComputeResult[]): LineResult[] {
  return computeResults.map((r) => ({ result: r.result, text: r.text, error: r.error }));
}
