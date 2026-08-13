use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[cfg(feature = "encoding")]
use encoding_rs::GBK;

/// 检查是否支持 GBK 编码（通过 encoding feature flag）
#[cfg(not(feature = "encoding"))]
fn encode_gbk(_content: &str) -> Result<Vec<u8>, String> {
    Err("GBK encoding not available. Build with --features encoding".to_string())
}

#[cfg(feature = "encoding")]
fn encode_gbk(content: &str) -> Result<Vec<u8>, String> {
    let (bytes, _, _) = GBK.encode(content);
    Ok(bytes.to_vec())
}

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

/// 获取设置文件路径：app_data_dir/settings.json
fn settings_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    }
    
    Ok(dir.join("settings.json"))
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

/// 加载设置文件（返回原始 JSON 字符串）
#[tauri::command]
fn load_settings(app: AppHandle) -> Result<Option<String>, String> {
    let path = settings_file_path(&app)?;
    
    if !path.exists() {
        return Ok(None);
    }
    
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read settings file: {}", e))?;
    
    Ok(Some(content))
}

/// 保存设置（接收 JSON 字符串，直接写入）
#[tauri::command]
fn save_settings(app: AppHandle, data: String) -> Result<(), String> {
    let path = settings_file_path(&app)?;
    
    fs::write(&path, data)
        .map_err(|e| format!("Failed to write settings file: {}", e))?;
    
    Ok(())
}

/// 按指定编码写入文件（支持 UTF-8 带BOM、UTF-8 无BOM、GBK）
#[tauri::command]
fn write_file_with_encoding(path: String, content: String, encoding: String) -> Result<(), String> {
    let encoding = encoding.to_lowercase();
    
    let bytes: Vec<u8> = match encoding.as_str() {
        "utf-8" => content.into_bytes(),
        "utf-8-bom" => {
            let mut bytes = vec![0xEF, 0xBB, 0xBF];
            bytes.extend(content.as_bytes());
            bytes
        }
        "gbk" => encode_gbk(&content)?,
        _ => return Err(format!("Unsupported encoding: {}", encoding)),
    };
    
    fs::write(&path, bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
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
        .invoke_handler(tauri::generate_handler![load_data, save_data, load_settings, save_settings, write_file_with_encoding])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
