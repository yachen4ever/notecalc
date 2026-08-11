export interface Line {
  id: number;
  text: string;
}

export interface LineResult {
  result: number | null;
  text: string;
  /** 计算错误信息（如前向引用、自引用、越界引用） */
  error?: string;
  /** 复合单位信息：归一化结果可按不同单位展示 */
  unitInfo?: UnitInfo;
}

/** 复合单位展示信息 */
export interface UnitInfo {
  /** 单位类别（time/weight/length/area/volume） */
  category: string;
  /** 归一化的基准值 */
  baseValue: number;
  /** 可切换的单位列表（从大到小排序） */
  units: UnitOption[];
  /** 默认展示的单位索引（输入中最大的单位） */
  defaultUnitIndex: number;
}

/** 可切换的单位选项 */
export interface UnitOption {
  /** 单位显示名 */
  label: string;
  /** 转换系数（baseValue / factor = 显示值） */
  factor: number;
  /** 特殊转换（温度用） */
  fromBase?: (v: number) => number;
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
