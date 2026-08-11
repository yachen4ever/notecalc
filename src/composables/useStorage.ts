import { invoke } from "@tauri-apps/api/core";
import type { WorksheetData } from "../types";

/**
 * 持久化：从本地文件加载数据
 */
export async function loadData(): Promise<WorksheetData | null> {
  try {
    return await invoke<WorksheetData | null>("load_data");
  } catch (e) {
    console.error("Failed to load data:", e);
    return null;
  }
}

/**
 * 持久化：保存数据到本地文件
 */
export async function saveData(data: WorksheetData): Promise<void> {
  try {
    await invoke("save_data", { data });
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}
