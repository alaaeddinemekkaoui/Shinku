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
pub fn refresh_folder_tree(path: Option<String>, state: State<AppState>) -> Result<FolderTreeResponse, String> {
    let controller = state.controller.lock().map_err(|e| e.to_string())?;
    
    // Use provided path or fall back to controller's current folder
    let folder_path = if let Some(p) = path {
        PathBuf::from(p)
    } else if let Some(folder_path) = controller.current_folder() {
        folder_path.clone()
    } else {
        return Ok(FolderTreeResponse {
            folder_path: String::new(),
            entries: Vec::new(),
        });
    };
    
    let path_str = folder_path.display().to_string();
    
    // Generate directory tree
    let tree = controller.get_directory_tree(&folder_path)
        .map_err(|e| e.to_string())?;
    
    Ok(FolderTreeResponse {
        folder_path: path_str,
        entries: tree,
    })
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
pub async fn rename_file_or_folder(old_path: String, new_name: String) -> Result<(), String> {
    let old_path_buf = PathBuf::from(&old_path);
    
    // Get the parent directory
    let parent = old_path_buf.parent()
        .ok_or("Cannot get parent directory".to_string())?.to_path_buf();
    
    // Create new path with new name
    let new_path = parent.join(&new_name);
    
    // Rename the file or folder
    std::fs::rename(&old_path_buf, &new_path)
        .map_err(|e| format!("Failed to rename: {}", e))?;
    
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

#[tauri::command]
pub async fn execute_terminal_command(command: String, working_dir: String) -> Result<String, String> {
    use std::process::Command;
    
    let working_path = if working_dir.is_empty() {
        std::env::current_dir().map_err(|e| e.to_string())?
    } else {
        PathBuf::from(&working_dir)
    };
    
    // Determine shell based on OS
    #[cfg(target_os = "windows")]
    let (shell, args) = ("cmd.exe", vec!["/C", &command]);
    
    #[cfg(not(target_os = "windows"))]
    let (shell, args) = ("sh", vec!["-c", &command]);
    
    let output = Command::new(shell)
        .args(&args)
        .current_dir(&working_path)
        .output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    
    if output.status.success() {
        Ok(if stdout.is_empty() { "(command executed successfully)".to_string() } else { stdout })
    } else {
        Ok(if stderr.is_empty() { "(command failed)".to_string() } else { stderr })
    }
}

#[tauri::command]
pub async fn open_external_terminal(path: String) -> Result<(), String> {
    use std::process::Command;
    
    let working_path = if path.is_empty() {
        std::env::current_dir().map_err(|e| e.to_string())?
    } else {
        PathBuf::from(&path)
    };
    
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd.exe")
            .args(&["/C", "start", "cmd.exe"])
            .current_dir(&working_path)
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        let script = format!("tell application \"Terminal\" to do script \"cd '{}'\"", 
            working_path.display());
        Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        Command::new("x-terminal-emulator")
            .current_dir(&working_path)
            .spawn()
            .or_else(|_| Command::new("gnome-terminal").current_dir(&working_path).spawn())
            .or_else(|_| Command::new("xfce4-terminal").current_dir(&working_path).spawn())
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }
    
    Ok(())
}
