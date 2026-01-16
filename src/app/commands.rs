/// Application commands
/// 
/// This module defines high-level commands that the application can execute.
/// These are typically triggered by UI events (menu clicks, keyboard shortcuts).
/// 
/// Commands are responsible for:
/// - Coordinating between different layers (core, platform, UI)
/// - Error handling and user feedback
/// - Side effects (file I/O, dialogs)

use crate::app::state::{AppState, Document};
use crate::platform::fs;
use anyhow::{Context, Result};
use std::path::PathBuf;

/// Command result that can be displayed to the user
pub struct CommandResult {
    pub success: bool,
    pub message: Option<String>,
}

impl CommandResult {
    pub fn success() -> Self {
        Self {
            success: true,
            message: None,
        }
    }

    pub fn success_with_message(message: String) -> Self {
        Self {
            success: true,
            message: Some(message),
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            message: Some(message),
        }
    }
}

/// Open a file
pub fn open_file(app_state: &mut AppState, path: PathBuf) -> Result<CommandResult> {
    let content = fs::read_file(&path)
        .with_context(|| format!("Failed to open file: {}", path.display()))?;

    let document = Document::from_file(path.clone(), content);
    app_state.current_document = document;

    Ok(CommandResult::success_with_message(format!(
        "Opened {}",
        path.display()
    )))
}

/// Save the current file
pub fn save_file(app_state: &mut AppState) -> Result<CommandResult> {
    if let Some(path) = app_state.file_path().cloned() {
        let content = app_state.editor().content();
        fs::write_file(&path, &content)
            .with_context(|| format!("Failed to save file: {}", path.display()))?;

        app_state.editor_mut().mark_saved();

        Ok(CommandResult::success_with_message(format!(
            "Saved {}",
            path.display()
        )))
    } else {
        // No file path - need to show "Save As" dialog
        Ok(CommandResult::error(
            "No file path. Use Save As.".to_string()
        ))
    }
}

/// Save the current file with a new path
pub fn save_file_as(app_state: &mut AppState, path: PathBuf) -> Result<CommandResult> {
    let content = app_state.editor().content();
    fs::write_file(&path, &content)
        .with_context(|| format!("Failed to save file: {}", path.display()))?;

    // Update document metadata
    app_state.current_document.file_path = Some(path.clone());
    app_state.current_document.title = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Untitled")
        .to_string();
    app_state.editor_mut().mark_saved();

    Ok(CommandResult::success_with_message(format!(
        "Saved as {}",
        path.display()
    )))
}

/// Create a new document
pub fn new_file(app_state: &mut AppState) -> Result<CommandResult> {
    // TODO: In a real app, check if current document is modified and prompt to save
    app_state.current_document = Document::new();
    Ok(CommandResult::success())
}

/// Check if the current document needs to be saved
pub fn needs_save(app_state: &AppState) -> bool {
    app_state.editor().is_modified()
}
