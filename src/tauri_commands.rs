use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use std::path::PathBuf;

use crate::app::{AppController, app_info};

#[derive(Default)]
pub struct AppState {
    controller: Mutex<AppController>,
}

#[derive(Serialize, Deserialize)]
pub struct EditorState {
    content: String,
    title: String,
    is_modified: bool,
    is_saved: bool,       // Track if file is persisted to disk
    line_count: usize,
    cursor_line: usize,
    cursor_column: usize,
}

#[derive(Serialize)]
pub struct FolderTreeResponse {
    folder_path: String,
    entries: Vec<crate::app::controller::DirectoryEntry>,
}

#[derive(Serialize)]
pub struct AppInfoData {
    name: String,
    version: String,
    edition: String,
    author: String,
    license: String,
    description: String,
    philosophy: String,
    repository: String,
    faq: Vec<(String, String)>,
}

#[tauri::command]
pub fn get_content(state: State<AppState>) -> Result<String, String> {
    let controller = state.controller.lock().map_err(|e| e.to_string())?;
    Ok(controller.content())
}

#[tauri::command]
pub fn set_content(content: String, state: State<AppState>) -> Result<(), String> {
    let mut controller = state.controller.lock().map_err(|e| e.to_string())?;
    controller.set_content(&content);
    controller.mark_modified();
    Ok(())
}

#[tauri::command]
pub fn get_editor_state(state: State<AppState>) -> Result<EditorState, String> {
    let controller = state.controller.lock().map_err(|e| e.to_string())?;
    let content = controller.content();
    let line_count = content.lines().count().max(1);
    let (cursor_line, cursor_column) = controller.cursor_position_display();
    let is_modified = controller.is_modified();
    let is_saved = controller.is_saved();
    
    Ok(EditorState {
        content,
        title: controller.title(),
        is_modified,
        is_saved,
        line_count,
        cursor_line,
        cursor_column,
    })
}

#[tauri::command]
pub fn new_file(state: State<AppState>) -> Result<EditorState, String> {
    let mut controller = state.controller.lock().map_err(|e| e.to_string())?;
    controller.new_file();
    // New file starts clean: is_saved=true, is_modified=false
    drop(controller);
    get_editor_state(state)
}

#[tauri::command]
pub async fn open_file(state: State<'_, AppState>) -> Result<EditorState, String> {
    use tauri::api::dialog::blocking::FileDialogBuilder;
    
    let file_path = FileDialogBuilder::new()
        .add_filter("Text Files", &["txt", "md", "rs", "toml", "json", "js", "ts", "html", "css"])
        .add_filter("All Files", &["*"])
        .pick_file();
    
    if let Some(path) = file_path {
        let mut controller = state.controller.lock().map_err(|e| e.to_string())?;
        controller.open_file(path)
            .map_err(|e| e.to_string())?;
    }
    
    get_editor_state(state)
}

#[tauri::command]
pub async fn open_file_from_path(file_path: String, state: State<'_, AppState>) -> Result<EditorState, String> {
    use std::path::PathBuf;
    
    let path = PathBuf::from(file_path);
    
    // Check if file exists
    if !path.is_file() {
        return Err(format!("File does not exist: {}", path.display()));
    }
    
    let mut controller = state.controller.lock().map_err(|e| e.to_string())?;
    controller.open_file(path)
        .map_err(|e| e.to_string())?;
    
    drop(controller);
    get_editor_state(state)
}

#[tauri::command]
pub async fn save_file(state: State<'_, AppState>) -> Result<EditorState, String> {
    let mut controller = state.controller.lock().map_err(|e| e.to_string())?;
    controller.save_file().map_err(|e| e.to_string())?;
    controller.mark_saved();  // Mark document as saved after successful save
    drop(controller);
    get_editor_state(state)
}

#[tauri::command]
pub async fn save_file_as(state: State<'_, AppState>) -> Result<EditorState, String> {
    use tauri::api::dialog::blocking::FileDialogBuilder;
    
    let file_path = FileDialogBuilder::new()
        .add_filter("Text Files", &["txt", "md"])
        .add_filter("Rust Files", &["rs"])
        .add_filter("JavaScript/TypeScript", &["js", "ts", "jsx", "tsx"])
        .add_filter("Web Files", &["html", "css", "json"])
        .add_filter("All Files", &["*"])
        .save_file();
    
    if let Some(path) = file_path {
        let mut controller = state.controller.lock().map_err(|e| e.to_string())?;
        controller.save_file_as(path)
            .map_err(|e| e.to_string())?;
        controller.mark_saved();  // Mark document as saved after successful save
    }
    
    get_editor_state(state)
}

#[tauri::command]
pub async fn open_folder(state: State<'_, AppState>) -> Result<FolderTreeResponse, String> {
    use tauri::api::dialog::blocking::FileDialogBuilder;
    
    let folder_path = FileDialogBuilder::new()
        .pick_folder();
    
    if let Some(path) = folder_path {
        let path_str = path.to_string_lossy().to_string();
        let mut controller = state.controller.lock().map_err(|e| e.to_string())?;
        controller.set_current_folder(path.clone());
        
        // Generate directory tree
        let tree = controller.get_directory_tree(&path)
            .map_err(|e| e.to_string())?;
        
        return Ok(FolderTreeResponse {
            folder_path: path_str,
            entries: tree,
        });
    }
    
    Ok(FolderTreeResponse {
        folder_path: String::new(),
        entries: Vec::new(),
    })
}

#[tauri::command]
pub fn refresh_folder_tree(state: State<AppState>) -> Result<FolderTreeResponse, String> {
    let controller = state.controller.lock().map_err(|e| e.to_string())?;
    
    // Get the current folder from the controller
    if let Some(folder_path) = controller.current_folder() {
        let folder_path_clone = folder_path.clone();
        let path_str = folder_path_clone.display().to_string();
        
        // Generate directory tree
        let tree = controller.get_directory_tree(&folder_path_clone)
            .map_err(|e| e.to_string())?;
        
        Ok(FolderTreeResponse {
            folder_path: path_str,
            entries: tree,
        })
    } else {
        Ok(FolderTreeResponse {
            folder_path: String::new(),
            entries: Vec::new(),
        })
    }
}

#[tauri::command]
pub fn get_creation_folder(state: State<AppState>) -> Result<Option<String>, String> {
    let controller = state.controller.lock().map_err(|e| e.to_string())?;
    Ok(controller.get_creation_folder().map(|p| p.display().to_string()))
}

#[tauri::command]
pub async fn create_file(parent_path: String, file_name: String) -> Result<(), String> {
    use std::fs::File;
    use std::path::Path;
    
    let file_path = Path::new(&parent_path).join(&file_name);
    
    File::create(&file_path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn create_folder(parent_path: String, folder_name: String) -> Result<(), String> {
    use std::fs;
    use std::path::Path;
    
    let folder_path = Path::new(&parent_path).join(&folder_name);
    
    fs::create_dir(&folder_path)
        .map_err(|e| format!("Failed to create folder: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub fn set_active_document(id: String, state: State<AppState>) -> Result<EditorState, String> {
    let mut controller = state.controller.lock().map_err(|e| e.to_string())?;
    controller.set_active_document(id);
    drop(controller);
    get_editor_state(state)
}

#[tauri::command]
pub fn get_open_documents(state: State<AppState>) -> Result<Vec<(String, String)>, String> {
    let controller = state.controller.lock().map_err(|e| e.to_string())?;
    let ids = controller.open_document_ids();
    // Return list of (id, title) pairs
    Ok(ids.iter().map(|id| (id.clone(), id.clone())).collect())
}

#[tauri::command]
pub async fn reveal_in_explorer(path: String) -> Result<(), String> {
    use std::process::Command;
    
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args(&["/select,", &path])
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(&["-R", &path])
            .spawn()
            .map_err(|e| format!("Failed to open finder: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        // Try to use xdg-open or nautilus
        let _ = Command::new("nautilus").arg(&path).spawn();
    }
    
    Ok(())
}

#[tauri::command]
pub async fn delete_file_or_folder(path: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    
    if path.is_file() {
        std::fs::remove_file(&path)
            .map_err(|e| format!("Failed to delete file: {}", e))?;
    } else if path.is_dir() {
        std::fs::remove_dir_all(&path)
            .map_err(|e| format!("Failed to delete folder: {}", e))?;
    } else {
        return Err("Path does not exist".to_string());
    }
    
    Ok(())
}

#[tauri::command]
pub fn undo(state: State<AppState>) -> Result<EditorState, String> {
    let mut controller = state.controller.lock().map_err(|e| e.to_string())?;
    controller.undo().map_err(|e| e.to_string())?;
    drop(controller);
    get_editor_state(state)
}

#[tauri::command]
pub fn redo(state: State<AppState>) -> Result<EditorState, String> {
    let mut controller = state.controller.lock().map_err(|e| e.to_string())?;
    controller.redo().map_err(|e| e.to_string())?;
    drop(controller);
    get_editor_state(state)
}

#[tauri::command]
pub fn insert_text(text: String, state: State<AppState>) -> Result<(), String> {
    let mut controller = state.controller.lock().map_err(|e| e.to_string())?;
    controller.set_content(&text);
    controller.mark_modified();  // Mark document as modified
    Ok(())
}

#[tauri::command]
pub fn get_app_info() -> AppInfoData {
    let info = app_info::AppInfo::new();
    AppInfoData {
        name: app_info::APP_NAME.to_string(),
        version: app_info::APP_VERSION.to_string(),
        edition: app_info::APP_EDITION.to_string(),
        author: app_info::AUTHOR.to_string(),
        license: app_info::LICENSE.to_string(),
        description: app_info::APP_DESCRIPTION.to_string(),
        philosophy: app_info::APP_PHILOSOPHY.to_string(),
        repository: app_info::REPOSITORY.to_string(),
        faq: info.faq.iter().map(|(q, a)| (q.to_string(), a.to_string())).collect(),
    }
}
