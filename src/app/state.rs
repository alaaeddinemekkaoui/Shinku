/// Application state
/// 
/// This module manages the application-level state that goes beyond a single editor.
/// Supports:
/// - Multiple open files/tabs
/// - Active file tracking
/// - Application settings
/// - Window state
/// - Theme preferences

use crate::core::Editor;
use std::path::PathBuf;
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

/// Represents a single document being edited
#[derive(Debug)]
pub struct Document {
    pub id: String,
    pub editor: Editor,
    pub file_path: Option<PathBuf>,
    pub title: String,
}

impl Document {
    /// Create a new untitled document
    pub fn new(id: String) -> Self {
        Self {
            id,
            editor: Editor::new(),
            file_path: None,
            title: "Untitled".to_string(),
        }
    }

    /// Create a document from a file
    pub fn from_file(id: String, path: PathBuf, content: String) -> Self {
        let title = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Untitled")
            .to_string();

        Self {
            id,
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
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();
        Self::new(format!("untitled-{}", timestamp))
    }
}

/// Application state
/// 
/// Manages multiple open documents with active file tracking.
pub struct AppState {
    pub documents: HashMap<String, Document>,
    pub active_document_id: Option<String>,
    pub current_folder: Option<PathBuf>,
}

impl AppState {
    pub fn new() -> Self {
        let doc = Document::default();
        let id = doc.id.clone();
        let mut documents = HashMap::new();
        documents.insert(id.clone(), doc);
        
        Self {
            documents,
            active_document_id: Some(id),
            current_folder: None,
        }
    }

    pub fn with_document(document: Document) -> Self {
        let id = document.id.clone();
        let mut documents = HashMap::new();
        documents.insert(id.clone(), document);
        
        Self {
            documents,
            active_document_id: Some(id),
            current_folder: None,
        }
    }

    /// Get the active document
    pub fn active_document(&self) -> Option<&Document> {
        self.active_document_id
            .as_ref()
            .and_then(|id| self.documents.get(id))
    }

    /// Get mutable access to the active document
    pub fn active_document_mut(&mut self) -> Option<&mut Document> {
        let id = self.active_document_id.clone();
        id.and_then(|id| self.documents.get_mut(&id))
    }

    /// Add a new document
    pub fn add_document(&mut self, document: Document) {
        let id = document.id.clone();
        self.documents.insert(id.clone(), document);
        self.active_document_id = Some(id);
    }

    /// Set the active document by ID
    pub fn set_active_document(&mut self, id: String) -> bool {
        if self.documents.contains_key(&id) {
            self.active_document_id = Some(id);
            true
        } else {
            false
        }
    }

    /// Remove a document by ID
    pub fn remove_document(&mut self, id: &str) -> bool {
        if self.documents.remove(id).is_some() {
            // If we removed the active document, switch to another one
            if self.active_document_id.as_deref() == Some(id) {
                self.active_document_id = self.documents.keys().next().cloned();
            }
            true
        } else {
            false
        }
    }

    /// Get all open document IDs
    pub fn open_document_ids(&self) -> Vec<String> {
        self.documents.keys().cloned().collect()
    }

    /// Get the current editor (active document's editor)
    pub fn editor(&self) -> Option<&Editor> {
        self.active_document().map(|d| &d.editor)
    }

    /// Get mutable access to the current editor
    pub fn editor_mut(&mut self) -> Option<&mut Editor> {
        self.active_document_mut().map(|d| &mut d.editor)
    }

    /// Get the current document title
    pub fn title(&self) -> String {
        self.active_document()
            .map(|d| d.title())
            .unwrap_or_else(|| "Untitled".to_string())
    }

    /// Get the current file path, if any
    pub fn file_path(&self) -> Option<&PathBuf> {
        self.active_document()
            .and_then(|d| d.file_path.as_ref())
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
