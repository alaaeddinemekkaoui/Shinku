/// Application state
/// 
/// This module manages the application-level state that goes beyond a single editor.
/// In a full implementation, this would handle:
/// - Multiple open files/tabs
/// - Application settings
/// - Window state
/// - Theme preferences
/// 
/// For Phase 1, we focus on single-file editing.

use crate::core::Editor;
use std::path::PathBuf;

/// Represents a single document being edited
#[derive(Debug)]
pub struct Document {
    pub editor: Editor,
    pub file_path: Option<PathBuf>,
    pub title: String,
}

impl Document {
    /// Create a new untitled document
    pub fn new() -> Self {
        Self {
            editor: Editor::new(),
            file_path: None,
            title: "Untitled".to_string(),
        }
    }

    /// Create a document from a file
    pub fn from_file(path: PathBuf, content: String) -> Self {
        let title = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Untitled")
            .to_string();

        Self {
            editor: Editor::with_content(&content),
            file_path: Some(path),
            title,
        }
    }

    /// Get the display title
    pub fn title(&self) -> String {
        let mut title = self.title.clone();
        if self.editor.is_modified() {
            title.push_str(" •");
        }
        title
    }

    /// Check if this is a new, unsaved document
    pub fn is_new(&self) -> bool {
        self.file_path.is_none()
    }
}

impl Default for Document {
    fn default() -> Self {
        Self::new()
    }
}

/// Application state
/// 
/// Contains all the state for the running application.
/// For Phase 1, we only support one document at a time.
#[derive(Debug)]
pub struct AppState {
    pub current_document: Document,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            current_document: Document::new(),
        }
    }

    pub fn with_document(document: Document) -> Self {
        Self {
            current_document: document,
        }
    }

    /// Get the current editor
    pub fn editor(&self) -> &Editor {
        &self.current_document.editor
    }

    /// Get mutable access to the current editor
    pub fn editor_mut(&mut self) -> &mut Editor {
        &mut self.current_document.editor
    }

    /// Get the current document title
    pub fn title(&self) -> String {
        self.current_document.title()
    }

    /// Get the current file path, if any
    pub fn file_path(&self) -> Option<&PathBuf> {
        self.current_document.file_path.as_ref()
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
