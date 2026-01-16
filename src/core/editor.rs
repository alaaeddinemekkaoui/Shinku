/// Editor orchestration
/// 
/// The Editor struct brings together buffer, cursor, and undo management.
/// It provides high-level operations that maintain consistency across these components.
/// 
/// This is still part of the core layer - it contains no UI code.

use crate::core::buffer::TextBuffer;
use crate::core::cursor::Cursor;
use crate::core::undo::{UndoManager, InsertCharCommand, DeleteCharCommand, InsertStringCommand};
use crate::core::types::{Position, Direction, CoreResult};

/// The main editor state
/// 
/// This represents the complete state of a single document being edited.
#[derive(Debug)]
pub struct Editor {
    buffer: TextBuffer,
    cursor: Cursor,
    undo_manager: UndoManager,
    modified: bool,
}

impl Editor {
    /// Create a new empty editor
    pub fn new() -> Self {
        Self {
            buffer: TextBuffer::new(),
            cursor: Cursor::new(),
            undo_manager: UndoManager::default(),
            modified: false,
        }
    }

    /// Create an editor with initial content
    pub fn with_content(content: &str) -> Self {
        Self {
            buffer: TextBuffer::from_str(content),
            cursor: Cursor::new(),
            undo_manager: UndoManager::default(),
            modified: false,
        }
    }

    // ========== Buffer access ==========

    /// Get a reference to the buffer
    pub fn buffer(&self) -> &TextBuffer {
        &self.buffer
    }

    /// Get the current cursor position
    pub fn cursor_position(&self) -> Position {
        self.cursor.position()
    }

    /// Check if the document has been modified
    pub fn is_modified(&self) -> bool {
        self.modified
    }

    /// Mark the document as saved
    pub fn mark_saved(&mut self) {
        self.modified = false;
    }

    // ========== Cursor operations ==========

    /// Move the cursor in the given direction
    pub fn move_cursor(&mut self, direction: Direction) -> CoreResult<()> {
        self.cursor.move_cursor(direction, &self.buffer)?;
        Ok(())
    }

    /// Set the cursor to a specific position
    pub fn set_cursor(&mut self, position: Position) -> CoreResult<()> {
        // Validate position
        if position.line >= self.buffer.line_count() {
            return Ok(()); // Silently clamp
        }
        
        self.cursor.set_position(position);
        self.cursor.clamp_to_buffer(&self.buffer)?;
        Ok(())
    }

    // ========== Edit operations ==========

    /// Insert a character at the cursor position
    pub fn insert_char(&mut self, ch: char) -> CoreResult<()> {
        let pos = self.cursor.position();
        let cmd = Box::new(InsertCharCommand::new(pos, ch));
        self.undo_manager.execute(cmd, &mut self.buffer)?;
        
        self.modified = true;
        
        // Move cursor forward
        self.move_cursor(Direction::Right)?;
        
        Ok(())
    }

    /// Insert text at the cursor position
    pub fn insert_text(&mut self, text: &str) -> CoreResult<()> {
        if text.is_empty() {
            return Ok(());
        }

        let pos = self.cursor.position();
        let cmd = Box::new(InsertStringCommand::new(pos, text.to_string()));
        self.undo_manager.execute(cmd, &mut self.buffer)?;
        
        self.modified = true;
        
        // Move cursor to end of inserted text
        let mut new_pos = pos;
        for ch in text.chars() {
            if ch == '\n' {
                new_pos.line += 1;
                new_pos.column = 0;
            } else {
                new_pos.column += 1;
            }
        }
        self.cursor.set_position(new_pos);
        
        Ok(())
    }

    /// Delete the character at the cursor (Delete key)
    pub fn delete_char(&mut self) -> CoreResult<()> {
        let pos = self.cursor.position();
        
        // Check if we're at the end of the buffer
        if pos.line >= self.buffer.line_count() {
            return Ok(());
        }
        
        let line_len = self.buffer.line_length(pos.line)?;
        if pos.column >= line_len && pos.line + 1 >= self.buffer.line_count() {
            return Ok(()); // At end of document
        }

        let cmd = Box::new(DeleteCharCommand::new(pos));
        self.undo_manager.execute(cmd, &mut self.buffer)?;
        
        self.modified = true;
        
        Ok(())
    }

    /// Delete the character before the cursor (Backspace key)
    pub fn backspace(&mut self) -> CoreResult<()> {
        if self.cursor.position() == Position::zero() {
            return Ok(()); // At start of document
        }

        // Move cursor back, then delete
        self.move_cursor(Direction::Left)?;
        let pos = self.cursor.position();
        
        let cmd = Box::new(DeleteCharCommand::new(pos));
        self.undo_manager.execute(cmd, &mut self.buffer)?;
        
        self.modified = true;
        
        Ok(())
    }

    /// Insert a newline at the cursor position
    pub fn insert_newline(&mut self) -> CoreResult<()> {
        self.insert_char('\n')
    }

    // ========== Undo/Redo ==========

    /// Undo the last operation
    pub fn undo(&mut self) -> CoreResult<bool> {
        if self.undo_manager.undo(&mut self.buffer)? {
            self.cursor.clamp_to_buffer(&self.buffer)?;
            self.modified = true;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Redo the last undone operation
    pub fn redo(&mut self) -> CoreResult<bool> {
        if self.undo_manager.redo(&mut self.buffer)? {
            self.cursor.clamp_to_buffer(&self.buffer)?;
            self.modified = true;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Check if undo is available
    pub fn can_undo(&self) -> bool {
        self.undo_manager.can_undo()
    }

    /// Check if redo is available
    pub fn can_redo(&self) -> bool {
        self.undo_manager.can_redo()
    }

    // ========== Content operations ==========

    /// Replace all content
    pub fn set_content(&mut self, content: &str) {
        self.buffer = TextBuffer::from_str(content);
        self.cursor = Cursor::new();
        self.undo_manager.clear();
        self.modified = false;
    }

    /// Get all content as a string
    pub fn content(&self) -> String {
        self.buffer.to_string()
    }

    /// Get visible lines for rendering (with line numbers)
    /// Returns (line_number, line_text) pairs
    pub fn visible_lines(&self, start: usize, count: usize) -> Vec<(usize, String)> {
        let end = (start + count).min(self.buffer.line_count());
        let mut lines = Vec::new();
        
        for line_idx in start..end {
            if let Ok(line_text) = self.buffer.line(line_idx) {
                lines.push((line_idx, line_text));
            }
        }
        
        lines
    }

    /// Get total line count
    pub fn line_count(&self) -> usize {
        self.buffer.line_count()
    }
}

impl Default for Editor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_editor_insert() {
        let mut editor = Editor::new();
        editor.insert_char('H').unwrap();
        editor.insert_char('i').unwrap();
        assert_eq!(editor.content(), "Hi");
        assert!(editor.is_modified());
    }

    #[test]
    fn test_editor_undo() {
        let mut editor = Editor::new();
        editor.insert_char('A').unwrap();
        assert_eq!(editor.content(), "A");
        
        editor.undo().unwrap();
        assert_eq!(editor.content(), "");
        
        editor.redo().unwrap();
        assert_eq!(editor.content(), "A");
    }

    #[test]
    fn test_editor_newline() {
        let mut editor = Editor::new();
        editor.insert_char('A').unwrap();
        editor.insert_newline().unwrap();
        editor.insert_char('B').unwrap();
        assert_eq!(editor.content(), "A\nB");
        assert_eq!(editor.line_count(), 2);
    }
}
