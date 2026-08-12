use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

/// 持久化数据结构：一个文件存所有工作表
#[derive(Serialize, Deserialize, Clone)]
pub struct WorksheetData {
    pub sheets: Vec<SheetData>,
    pub active_sheet_id: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SheetData {
    pub id: String,
    pub name: String,
    pub lines: Vec<LineData>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct LineData {
    pub id: i64,
    pub text: String,
}

/// 获取数据文件路径：app_data_dir/notecalc.json
fn data_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    // 确保目录存在
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    }
    
    Ok(dir.join("notecalc.json"))
}

/// 加载持久化数据
#[tauri::command]
fn load_data(app: AppHandle) -> Result<Option<WorksheetData>, String> {
    let path = data_file_path(&app)?;
    
    if !path.exists() {
        return Ok(None);
    }
    
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read data file: {}", e))?;
    
    let data: WorksheetData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse data file: {}", e))?;
    
    Ok(Some(data))
}

/// 保存持久化数据
#[tauri::command]
fn save_data(app: AppHandle, data: WorksheetData) -> Result<(), String> {
    let path = data_file_path(&app)?;
    
    let content = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize data: {}", e))?;
    
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write data file: {}", e))?;
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![load_data, save_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
