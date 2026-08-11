export interface Line {
  id: number;
  text: string;
}

export interface LineResult {
  result: number | null;
  text: string;
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
