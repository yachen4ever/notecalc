import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import type { AppSettings } from "../types";

export const DEFAULT_SETTINGS: AppSettings = {
  font: "'SF Mono', 'Cascadia Code', 'Menlo', 'Consolas', monospace",
  fontSize: 15,
  theme: "dark",
  language: "zh",
  decimalPlaces: 2,
  thousandsSeparator: true,
  tabBehavior: "navigate",
  dataDir: "",
  exportEncoding: "utf-8",
  defaultExportFormat: "json",
};

/** 可选字体列表 */
export const FONT_PRESETS: { label: string; value: string }[] = [
  { label: "SF Mono", value: "'SF Mono', 'Menlo', monospace" },
  { label: "Cascadia Code", value: "'Cascadia Code', 'Consolas', monospace" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', 'Menlo', monospace" },
  { label: "Fira Code", value: "'Fira Code', 'Menlo', monospace" },
  { label: "Menlo", value: "'Menlo', 'Monaco', monospace" },
  { label: "Consolas", value: "'Consolas', 'Menlo', monospace" },
  { label: "Courier New", value: "'Courier New', monospace" },
];

/** 字号选项 */
export const FONT_SIZE_OPTIONS = [12, 13, 14, 15, 16, 18, 20];

/** 小数位数选项 */
export const DECIMAL_PLACE_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS });
let loaded = false;

/** 从 Rust 后端加载设置 */
export async function loadSettings(): Promise<AppSettings> {
  try {
    const data = await invoke<string | null>("load_settings");
    if (data) {
      const parsed = JSON.parse(data) as Partial<AppSettings>;
      // 合并默认值，防止旧版本缺少新字段
      settings.value = { ...DEFAULT_SETTINGS, ...parsed };
    } else {
      settings.value = { ...DEFAULT_SETTINGS };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
    settings.value = { ...DEFAULT_SETTINGS };
  }
  loaded = true;
  return settings.value;
}

/** 保存设置到 Rust 后端 */
export async function saveSettings(data?: AppSettings): Promise<void> {
  try {
    const toSave = data ?? settings.value;
    await invoke("save_settings", { data: JSON.stringify(toSave, null, 2) });
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

/** 获取当前设置（响应式 ref） */
export function useSettings() {
  return settings;
}

/** 是否已加载 */
export function isSettingsLoaded() {
  return loaded;
}
