/// Application controller
/// 
/// The controller is the bridge between the UI and the core editor logic.
/// It translates UI events into editor operations and provides data for the UI to display.
/// 
/// CRITICAL: The controller should not contain any UI-specific code.
/// It works with abstract data types that the UI layer can consume.

use crate::app::state::AppState;
use crate::app::commands;
use crate::core::{Direction, Position};
use anyhow::Result;
use std::path::PathBuf;
use std::fs;

/// Main application controller
/// 
/// This is the API that the UI layer uses to interact with the application.
pub struct AppController {
    state: AppState,
}

impl AppController {
    pub fn new() -> Self {
        log::info!("Initializing Phoenix editor");
        Self {
            state: AppState::new(),
        }
    }

    // ========== Document queries (for UI to display) ==========

    /// Get the visible lines for rendering
    /// Returns a vector of (line_number, line_text) tuples
    pub fn visible_lines(&self, start_line: usize, line_count: usize) -> Vec<(usize, String)> {
        self.state
            .editor()
            .map(|e| e.visible_lines(start_line, line_count))
            .unwrap_or_default()
    }

    /// Get the cursor position for display (1-indexed)
    pub fn cursor_position_display(&self) -> (usize, usize) {
        self.state
            .editor()
            .map(|e| e.cursor_position().to_display())
            .unwrap_or((1, 1))
    }

    /// Get the cursor position (0-indexed)
    pub fn cursor_position(&self) -> Position {
        self.state
            .editor()
            .map(|e| e.cursor_position())
            .unwrap_or(Position { line: 0, column: 0 })
    }

    /// Get the total line count
    pub fn line_count(&self) -> usize {
        self.state
            .editor()
            .map(|e| e.line_count())
            .unwrap_or(1)
    }

    /// Get the document title
    pub fn title(&self) -> String {
        self.state.title()
    }

    /// Get all text content
    pub fn content(&self) -> String {
        self.state
            .editor()
            .map(|e| e.content())
            .unwrap_or_default()
    }

    /// Check if document is modified
    pub fn is_modified(&self) -> bool {
        self.state
            .editor()
            .map(|e| e.is_modified())
            .unwrap_or(false)
    }

    /// Check if document is saved to disk
    pub fn is_saved(&self) -> bool {
        self.state
            .active_document()
            .map(|d| d.is_saved)
            .unwrap_or(false)
    }

    /// Mark the active document as modified and not saved
    pub fn mark_modified(&mut self) {
        if let Some(doc) = self.state.active_document_mut() {
            doc.is_modified = true;
            doc.is_saved = false;
        }
    }

    /// Mark the active document as saved
    pub fn mark_saved(&mut self) {
        if let Some(doc) = self.state.active_document_mut() {
            doc.is_modified = false;
            doc.is_saved = true;
        }
    }

    /// Check if undo is available
    pub fn can_undo(&self) -> bool {
        self.state
            .editor()
            .map(|e| e.can_undo())
            .unwrap_or(false)
    }

    /// Check if redo is available
    pub fn can_redo(&self) -> bool {
        self.state
            .editor()
            .map(|e| e.can_redo())
            .unwrap_or(false)
    }

    // ========== Editor operations (triggered by UI events) ==========

    /// Handle text input from the user
    pub fn handle_text_input(&mut self, text: &str) -> Result<()> {
        log::debug!("Text input: {:?}", text);
        if let Some(editor) = self.state.editor_mut() {
            for ch in text.chars() {
                editor.insert_char(ch)?;
            }
        }
        Ok(())
    }

    /// Handle backspace key
    pub fn handle_backspace(&mut self) -> Result<()> {
        log::debug!("Backspace");
        if let Some(editor) = self.state.editor_mut() {
            editor.backspace()?;
        }
        Ok(())
    }

    /// Handle delete key
    pub fn handle_delete(&mut self) -> Result<()> {
        log::debug!("Delete");
        if let Some(editor) = self.state.editor_mut() {
            editor.delete_char()?;
        }
        Ok(())
    }

    /// Handle enter/return key
    pub fn handle_enter(&mut self) -> Result<()> {
        log::debug!("Enter");
        if let Some(editor) = self.state.editor_mut() {
            editor.insert_newline()?;
        }
        Ok(())
    }

    /// Handle cursor movement
    pub fn move_cursor(&mut self, direction: Direction) -> Result<()> {
        log::debug!("Move cursor: {:?}", direction);
        if let Some(editor) = self.state.editor_mut() {
            editor.move_cursor(direction)?;
        }
        Ok(())
    }

    /// Move cursor by lines (for Page Up/Page Down - moves by 10 lines)
    pub fn move_cursor_by_lines(&mut self, line_offset: i32) -> Result<()> {
        if let Some(editor) = self.state.editor_mut() {
            let current_pos = editor.cursor_position();
            let new_line = (current_pos.line as i32 + line_offset).max(0) as usize;
            let total_lines = editor.line_count().saturating_sub(1);
            let _clamped_line = new_line.min(total_lines);
            
            for _ in 0..line_offset.abs() {
                if line_offset > 0 {
                    editor.move_cursor(Direction::Down)?;
                } else {
                    editor.move_cursor(Direction::Up)?;
                }
            }
        }
        Ok(())
    }

    /// Handle undo
    pub fn undo(&mut self) -> Result<bool> {
        log::debug!("Undo");
        if let Some(editor) = self.state.editor_mut() {
            Ok(editor.undo()?)
        } else {
            Ok(false)
        }
    }

    /// Handle redo
    pub fn redo(&mut self) -> Result<bool> {
        log::debug!("Redo");
        if let Some(editor) = self.state.editor_mut() {
            Ok(editor.redo()?)
        } else {
            Ok(false)
        }
    }

    // ========== File operations ==========

    /// Open a file
    pub fn open_file(&mut self, path: PathBuf) -> Result<String> {
        log::info!("Opening file: {}", path.display());
        let result = commands::open_file(&mut self.state, path)?;
        Ok(result.message.unwrap_or_default())
    }

    /// Save the current file
    pub fn save_file(&mut self) -> Result<String> {
        log::info!("Saving file");
        let result = commands::save_file(&mut self.state)?;
        Ok(result.message.unwrap_or_default())
    }

    /// Save the current file with a new path
    pub fn save_file_as(&mut self, path: PathBuf) -> Result<String> {
        log::info!("Saving file as: {}", path.display());
        let result = commands::save_file_as(&mut self.state, path)?;
        Ok(result.message.unwrap_or_default())
    }

    /// Create a new file
    pub fn new_file(&mut self) -> Result<()> {
        log::info!("Creating new file");
        commands::new_file(&mut self.state)?;
        Ok(())
    }

    /// Get the current file path, if any
    pub fn file_path(&self) -> Option<String> {
        self.state.file_path().map(|p| p.display().to_string())
    }

    /// Set active document by ID
    pub fn set_active_document(&mut self, id: String) -> bool {
        self.state.set_active_document(id)
    }

    /// Get all open document IDs
    pub fn open_document_ids(&self) -> Vec<String> {
        self.state.open_document_ids()
    }

    /// Set the current folder path
    pub fn set_current_folder(&mut self, path: PathBuf) {
        self.state.current_folder = Some(path);
    }

    /// Get the current folder path
    pub fn current_folder(&self) -> Option<&PathBuf> {
        self.state.current_folder.as_ref()
    }

    /// Get the appropriate folder for creating new files/folders
    /// Returns the open folder path, or the folder of the active file, or None
    pub fn get_creation_folder(&self) -> Option<PathBuf> {
        // First priority: use the open folder if one is set
        if let Some(folder) = self.state.current_folder.as_ref() {
            return Some(folder.clone());
        }
        
        // Second priority: use the folder of the active file
        if let Some(file_path) = self.state.file_path() {
            if let Some(parent) = file_path.parent() {
                return Some(parent.to_path_buf());
            }
        }
        
        // No folder available
        None
    }

    /// Generate directory tree from a folder
    pub fn get_directory_tree(&self, folder: &PathBuf) -> Result<Vec<DirectoryEntry>> {
        generate_tree_entries(folder, 0)
    }

    // ========== For testing/debugging ==========

    /// Set content directly (useful for testing)
    pub fn set_content(&mut self, content: &str) {
        if let Some(editor) = self.state.editor_mut() {
            editor.set_content(content);
        }
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct DirectoryEntry {
    pub id: String,
    pub name: String,
    pub entry_type: String, // "file" or "folder"
    pub path: String,
    pub children: Option<Vec<DirectoryEntry>>,
}

fn generate_tree_entries(path: &PathBuf, depth: usize) -> Result<Vec<DirectoryEntry>> {
    const MAX_DEPTH: usize = 10;
    
    if depth > MAX_DEPTH {
        return Ok(Vec::new());
    }

    let mut entries = Vec::new();
    
    if path.is_dir() {
        let mut entries_with_order: Vec<_> = fs::read_dir(path)?
            .filter_map(|entry| entry.ok())
            .collect();
        
        // Sort: folders first, then files, alphabetically
        entries_with_order.sort_by(|a, b| {
            let a_is_dir = a.path().is_dir();
            let b_is_dir = b.path().is_dir();
            
            if a_is_dir != b_is_dir {
                return if a_is_dir { std::cmp::Ordering::Less } else { std::cmp::Ordering::Greater };
            }
            
            let a_name = a.file_name();
            let b_name = b.file_name();
            a_name.cmp(&b_name)
        });
        
        for dir_entry in entries_with_order {
            let path = dir_entry.path();
            let name = dir_entry.file_name();
            let name_str = name.to_string_lossy().to_string();
            
            // Skip hidden files and common unneeded directories
            if name_str.starts_with('.') || name_str == "node_modules" || name_str == "target" {
                continue;
            }
            
            let is_dir = path.is_dir();
            let id = path.display().to_string();
            
            let entry = DirectoryEntry {
                id: id.clone(),
                name: name_str,
                entry_type: if is_dir { "folder".to_string() } else { "file".to_string() },
                path: id,
                children: if is_dir {
                    Some(generate_tree_entries(&path, depth + 1)?)
                } else {
                    None
                },
            };
            
            entries.push(entry);
        }
    }
    
    Ok(entries)
}

impl Default for AppController {
    fn default() -> Self {
        Self::new()
    }
}
