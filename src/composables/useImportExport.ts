import type { Worksheet } from "../types";
import { calculateLine, formatNumber } from "./useCalculator";

/**
 * 导出为 JSON 字符串
 */
export function exportJSON(sheets: Worksheet[]): string {
  return JSON.stringify(sheets, null, 2);
}

/**
 * 导出单个工作表为 CSV 字符串
 */
export function exportCSV(sheet: Worksheet): string {
  const rows = ["行号,内容,结果"];
  sheet.lines.forEach((line, i) => {
    const { text } = calculateLine(line.text);
    const escaped = `"${line.text.replace(/"/g, '""')}"`;
    rows.push(`${i + 1},${escaped},${text || ""}`);
  });
  return rows.join("\n");
}

/**
 * 导出单个工作表为 Markdown 字符串
 */
export function exportMarkdown(sheet: Worksheet): string {
  const lines: string[] = [`# ${sheet.name}`, ""];
  const summary = sheet.lines.reduce(
    (acc, line) => {
      const { result } = calculateLine(line.text);
      if (result !== null) {
        acc.total += result;
        acc.count++;
      }
      return acc;
    },
    { total: 0, count: 0 }
  );

  lines.push("| 行 | 内容 | 结果 |", "|---|---|---|");
  sheet.lines.forEach((line, i) => {
    const { text } = calculateLine(line.text);
    lines.push(`| ${i + 1} | ${line.text} | ${text || "—"} |`);
  });

  lines.push("");
  lines.push(`**总计：** ${summary.count > 0 ? formatNumber(summary.total) : "—"}`);
  return lines.join("\n");
}

/**
 * 从 JSON 字符串导入
 */
export function importJSON(json: string): Worksheet[] | null {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return null;
    // 基本校验
    for (const sheet of data) {
      if (!sheet.id || !sheet.name || !Array.isArray(sheet.lines)) return null;
    }
    return data as Worksheet[];
  } catch {
    return null;
  }
}
