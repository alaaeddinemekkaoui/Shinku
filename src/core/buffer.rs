/// Text buffer implementation using Rope data structure
/// 
/// WHY ROPE?
/// - Efficient insertions/deletions at any position: O(log n)
/// - Efficient substring operations
/// - Memory efficient for large files
/// - Better than gap buffer for multiple cursors (future)
/// 
/// The ropey crate provides a production-quality rope implementation
/// with excellent performance characteristics.

use ropey::Rope;
use crate::core::types::{Position, CoreResult, CoreError};

/// The core text buffer
/// 
/// This struct is the foundation of the editor. It manages the actual text content
/// and provides operations to manipulate it. It is completely UI-agnostic.
#[derive(Debug, Clone)]
pub struct TextBuffer {
    rope: Rope,
}

impl TextBuffer {
    /// Create a new empty buffer
    pub fn new() -> Self {
        Self {
            rope: Rope::new(),
        }
    }

    /// Create a buffer from existing text
    pub fn from_str(text: &str) -> Self {
        Self {
            rope: Rope::from_str(text),
        }
    }

    /// Get the total number of lines
    pub fn line_count(&self) -> usize {
        self.rope.len_lines()
    }

    /// Get the total number of characters
    pub fn char_count(&self) -> usize {
        self.rope.len_chars()
    }

    /// Get the length of a specific line (excluding newline)
    pub fn line_length(&self, line: usize) -> CoreResult<usize> {
        if line >= self.line_count() {
            return Err(CoreError::InvalidPosition(line, 0));
        }

        let line_start = self.rope.line_to_char(line);
        let line_end = if line + 1 < self.line_count() {
            self.rope.line_to_char(line + 1)
        } else {
            self.rope.len_chars()
        };

        let line_slice = self.rope.slice(line_start..line_end);
        let len = line_slice.len_chars();
        
        // Remove newline character from count if present
        if len > 0 && line_slice.char(len - 1) == '\n' {
            Ok(len - 1)
        } else {
            Ok(len)
        }
    }

    /// Insert a character at the given position
    pub fn insert_char(&mut self, pos: Position, ch: char) -> CoreResult<()> {
        let char_idx = self.position_to_char_index(pos)?;
        self.rope.insert_char(char_idx, ch);
        Ok(())
    }

    /// Insert a string at the given position
    pub fn insert_str(&mut self, pos: Position, text: &str) -> CoreResult<()> {
        let char_idx = self.position_to_char_index(pos)?;
        self.rope.insert(char_idx, text);
        Ok(())
    }

    /// Delete a character at the given position
    pub fn delete_char(&mut self, pos: Position) -> CoreResult<char> {
        let char_idx = self.position_to_char_index(pos)?;
        
        if char_idx >= self.rope.len_chars() {
            return Err(CoreError::InvalidPosition(pos.line, pos.column));
        }

        let ch = self.rope.char(char_idx);
        self.rope.remove(char_idx..char_idx + 1);
        Ok(ch)
    }

    /// Delete a range of characters
    pub fn delete_range(&mut self, start: Position, end: Position) -> CoreResult<String> {
        let start_idx = self.position_to_char_index(start)?;
        let end_idx = self.position_to_char_index(end)?;

        if start_idx > end_idx {
            return Err(CoreError::InvalidOperation(
                "Start position must be before end position".to_string()
            ));
        }

        let deleted = self.rope.slice(start_idx..end_idx).to_string();
        self.rope.remove(start_idx..end_idx);
        Ok(deleted)
    }

    /// Get a line of text (without newline)
    pub fn line(&self, line: usize) -> CoreResult<String> {
        if line >= self.line_count() {
            return Err(CoreError::InvalidPosition(line, 0));
        }

        let line_start = self.rope.line_to_char(line);
        let line_end = if line + 1 < self.line_count() {
            self.rope.line_to_char(line + 1)
        } else {
            self.rope.len_chars()
        };

        let mut line_text = self.rope.slice(line_start..line_end).to_string();
        
        // Remove trailing newline
        if line_text.ends_with('\n') {
            line_text.pop();
            if line_text.ends_with('\r') {
                line_text.pop();
            }
        }

        Ok(line_text)
    }

    /// Get all text as a string
    pub fn to_string(&self) -> String {
        self.rope.to_string()
    }

    /// Get a range of lines (inclusive)
    pub fn lines_range(&self, start_line: usize, end_line: usize) -> CoreResult<Vec<String>> {
        if start_line >= self.line_count() {
            return Err(CoreError::InvalidPosition(start_line, 0));
        }

        let end = end_line.min(self.line_count() - 1);
        let mut lines = Vec::new();
        
        for line in start_line..=end {
            lines.push(self.line(line)?);
        }

        Ok(lines)
    }

    /// Clear all content
    pub fn clear(&mut self) {
        self.rope = Rope::new();
    }

    /// Check if buffer is empty
    pub fn is_empty(&self) -> bool {
        self.rope.len_chars() == 0
    }

    /// Convert a Position to a character index in the rope
    fn position_to_char_index(&self, pos: Position) -> CoreResult<usize> {
        if pos.line >= self.line_count() {
            return Err(CoreError::InvalidPosition(pos.line, pos.column));
        }

        let line_start = self.rope.line_to_char(pos.line);
        let char_idx = line_start + pos.column;

        // Validate that the column is within the line
        let line_end = if pos.line + 1 < self.line_count() {
            self.rope.line_to_char(pos.line + 1)
        } else {
            self.rope.len_chars()
        };

        if char_idx > line_end {
            return Err(CoreError::InvalidPosition(pos.line, pos.column));
        }

        Ok(char_idx)
    }

    /// Convert a character index to a Position
    pub fn char_index_to_position(&self, char_idx: usize) -> Position {
        let line = self.rope.char_to_line(char_idx);
        let line_start = self.rope.line_to_char(line);
        let column = char_idx - line_start;
        Position::new(line, column)
    }
}

impl Default for TextBuffer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_buffer() {
        let buffer = TextBuffer::new();
        assert_eq!(buffer.line_count(), 1);
        assert_eq!(buffer.char_count(), 0);
        assert!(buffer.is_empty());
    }

    #[test]
    fn test_insert_char() {
        let mut buffer = TextBuffer::new();
        buffer.insert_char(Position::zero(), 'H').unwrap();
        buffer.insert_char(Position::new(0, 1), 'i').unwrap();
        assert_eq!(buffer.to_string(), "Hi");
    }

    #[test]
    fn test_multiline() {
        let buffer = TextBuffer::from_str("Hello\nWorld\n");
        assert_eq!(buffer.line_count(), 3); // Rope counts empty line at end
        assert_eq!(buffer.line(0).unwrap(), "Hello");
        assert_eq!(buffer.line(1).unwrap(), "World");
    }

    #[test]
    fn test_delete_char() {
        let mut buffer = TextBuffer::from_str("Hello");
        let deleted = buffer.delete_char(Position::new(0, 0)).unwrap();
        assert_eq!(deleted, 'H');
        assert_eq!(buffer.to_string(), "ello");
    }
}
