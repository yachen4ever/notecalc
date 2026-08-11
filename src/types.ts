export interface Line {
  id: number;
  text: string;
}

export interface LineResult {
  result: number | null;
  text: string;
  /** 计算错误信息（如前向引用、自引用、越界引用） */
  error?: string;
}

export interface Worksheet {
  id: string;
  name: string;
  lines: Line[];
}

export interface WorksheetData {
  sheets: Worksheet[];
  active_sheet_id: string;
}
