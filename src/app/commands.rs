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

/// Open a file in a new tab
pub fn open_file(app_state: &mut AppState, path: PathBuf) -> Result<CommandResult> {
    let content = crate::platform::fs::read_file(&path)
        .with_context(|| format!("Failed to open file: {}", path.display()))?;

    let id = path.display().to_string();
    let document = Document::from_file(id, path.clone(), content);
    app_state.add_document(document);

    Ok(CommandResult::success_with_message(format!(
        "Opened {}",
        path.display()
    )))
}

/// Save the current file
pub fn save_file(app_state: &mut AppState) -> Result<CommandResult> {
    if let Some(path) = app_state.file_path().cloned() {
        let content = app_state
            .editor()
            .map(|e| e.content())
            .unwrap_or_default();
        crate::platform::fs::write_file(&path, &content)
            .with_context(|| format!("Failed to save file: {}", path.display()))?;

        if let Some(doc) = app_state.active_document_mut() {
            doc.editor.mark_saved();
        }

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
    let content = app_state
        .editor()
        .map(|e| e.content())
        .unwrap_or_default();
    crate::platform::fs::write_file(&path, &content)
        .with_context(|| format!("Failed to save file: {}", path.display()))?;

    // Update document metadata
    if let Some(doc) = app_state.active_document_mut() {
        doc.file_path = Some(path.clone());
        doc.title = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Untitled")
            .to_string();
        doc.editor.mark_saved();
    }

    Ok(CommandResult::success_with_message(format!(
        "Saved as {}",
        path.display()
    )))
}

/// Create a new document
pub fn new_file(app_state: &mut AppState) -> Result<CommandResult> {
    let document = Document::default();
    app_state.add_document(document);
    Ok(CommandResult::success())
}

/// Open a folder and set it as the current workspace
pub fn open_folder(app_state: &mut AppState, path: PathBuf) -> Result<CommandResult> {
    // Check if folder exists
    if !path.is_dir() {
        return Ok(CommandResult::error(format!(
            "Not a directory: {}",
            path.display()
        )));
    }

    app_state.current_folder = Some(path.clone());

    Ok(CommandResult::success_with_message(format!(
        "Opened folder: {}",
        path.display()
    )))
}

/// Close the current folder
pub fn close_folder(app_state: &mut AppState) -> Result<CommandResult> {
    app_state.current_folder = None;
    Ok(CommandResult::success())
}

/// Get the file tree for the current folder
pub fn get_file_tree(app_state: &AppState) -> Result<Vec<FileTreeNode>> {
    if let Some(folder) = &app_state.current_folder {
        build_file_tree(folder)
    } else {
        Ok(Vec::new())
    }
}

/// Represents a file or folder in the file tree
#[derive(Debug, Clone)]
pub struct FileTreeNode {
    pub path: PathBuf,
    pub name: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileTreeNode>>,
}

/// Build file tree recursively (with depth limit to avoid performance issues)
fn build_file_tree(path: &PathBuf) -> Result<Vec<FileTreeNode>> {
    build_file_tree_recursive(path, 0)
}

fn build_file_tree_recursive(path: &PathBuf, depth: usize) -> Result<Vec<FileTreeNode>> {
    const MAX_DEPTH: usize = 10; // Limit recursion depth
    
    if depth > MAX_DEPTH {
        return Ok(Vec::new());
    }

    let mut nodes = Vec::new();

    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let path = entry.path();
            let name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("Unknown")
                .to_string();

            let is_dir = path.is_dir();
            
            let children = if is_dir {
                build_file_tree_recursive(&path, depth + 1).ok()
            } else {
                None
            };

            nodes.push(FileTreeNode {
                path,
                name,
                is_dir,
                children,
            });
        }
    }

    // Sort: directories first, then by name
    nodes.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        }
    });

    Ok(nodes)
}

/// Switch between open documents
pub fn switch_document(app_state: &mut AppState, document_id: &str) -> Result<CommandResult> {
    if app_state.set_active_document(document_id.to_string()) {
        Ok(CommandResult::success())
    } else {
        Ok(CommandResult::error(format!(
            "Document not found: {}",
            document_id
        )))
    }
}

/// Close a document tab
pub fn close_document(app_state: &mut AppState, document_id: &str) -> Result<CommandResult> {
    if app_state.remove_document(document_id) {
        Ok(CommandResult::success())
    } else {
        Ok(CommandResult::error(format!(
            "Document not found: {}",
            document_id
        )))
    }
}
