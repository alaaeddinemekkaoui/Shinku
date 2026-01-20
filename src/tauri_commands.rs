use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

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
    line_count: usize,
    cursor_line: usize,
    cursor_column: usize,
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
    Ok(())
}

#[tauri::command]
pub fn get_editor_state(state: State<AppState>) -> Result<EditorState, String> {
    let controller = state.controller.lock().map_err(|e| e.to_string())?;
    let content = controller.content();
    let line_count = content.lines().count().max(1);
    let (cursor_line, cursor_column) = controller.cursor_position_display();
    
    Ok(EditorState {
        content,
        title: controller.title(),
        is_modified: controller.is_modified(),
        line_count,
        cursor_line,
        cursor_column,
    })
}

#[tauri::command]
pub fn new_file(state: State<AppState>) -> Result<EditorState, String> {
    let mut controller = state.controller.lock().map_err(|e| e.to_string())?;
    controller.new_file();
    drop(controller); // Release lock before calling get_editor_state
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
pub async fn save_file(state: State<'_, AppState>) -> Result<EditorState, String> {
    let mut controller = state.controller.lock().map_err(|e| e.to_string())?;
    controller.save_file().map_err(|e| e.to_string())?;
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
    }
    
    get_editor_state(state)
}

#[tauri::command]
pub async fn open_folder(state: State<'_, AppState>) -> Result<EditorState, String> {
    use tauri::api::dialog::blocking::FileDialogBuilder;
    
    let folder_path = FileDialogBuilder::new()
        .pick_folder();
    
    if let Some(_path) = folder_path {
        // For now, just return current state
        // TODO: Implement folder browsing functionality
    }
    
    get_editor_state(state)
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
