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
        self.state.editor().visible_lines(start_line, line_count)
    }

    /// Get the cursor position for display (1-indexed)
    pub fn cursor_position_display(&self) -> (usize, usize) {
        self.state.editor().cursor_position().to_display()
    }

    /// Get the cursor position (0-indexed)
    pub fn cursor_position(&self) -> Position {
        self.state.editor().cursor_position()
    }

    /// Get the total line count
    pub fn line_count(&self) -> usize {
        self.state.editor().line_count()
    }

    /// Get the document title
    pub fn title(&self) -> String {
        self.state.title()
    }

    /// Get all text content
    pub fn content(&self) -> String {
        self.state.editor().content()
    }

    /// Check if document is modified
    pub fn is_modified(&self) -> bool {
        self.state.editor().is_modified()
    }

    /// Check if undo is available
    pub fn can_undo(&self) -> bool {
        self.state.editor().can_undo()
    }

    /// Check if redo is available
    pub fn can_redo(&self) -> bool {
        self.state.editor().can_redo()
    }

    // ========== Editor operations (triggered by UI events) ==========

    /// Handle text input from the user
    pub fn handle_text_input(&mut self, text: &str) -> Result<()> {
        log::debug!("Text input: {:?}", text);
        for ch in text.chars() {
            self.state.editor_mut().insert_char(ch)?;
        }
        Ok(())
    }

    /// Handle backspace key
    pub fn handle_backspace(&mut self) -> Result<()> {
        log::debug!("Backspace");
        self.state.editor_mut().backspace()?;
        Ok(())
    }

    /// Handle delete key
    pub fn handle_delete(&mut self) -> Result<()> {
        log::debug!("Delete");
        self.state.editor_mut().delete_char()?;
        Ok(())
    }

    /// Handle enter/return key
    pub fn handle_enter(&mut self) -> Result<()> {
        log::debug!("Enter");
        self.state.editor_mut().insert_newline()?;
        Ok(())
    }

    /// Handle cursor movement
    pub fn move_cursor(&mut self, direction: Direction) -> Result<()> {
        log::debug!("Move cursor: {:?}", direction);
        self.state.editor_mut().move_cursor(direction)?;
        Ok(())
    }

    /// Handle undo
    pub fn undo(&mut self) -> Result<bool> {
        log::debug!("Undo");
        Ok(self.state.editor_mut().undo()?)
    }

    /// Handle redo
    pub fn redo(&mut self) -> Result<bool> {
        log::debug!("Redo");
        Ok(self.state.editor_mut().redo()?)
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

    // ========== For testing/debugging ==========

    /// Set content directly (useful for testing)
    pub fn set_content(&mut self, content: &str) {
        self.state.editor_mut().set_content(content);
    }
}

impl Default for AppController {
    fn default() -> Self {
        Self::new()
    }
}
