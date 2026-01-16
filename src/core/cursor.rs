/// Cursor management
/// 
/// The cursor represents the user's current position in the buffer.
/// It is separate from the buffer to maintain single responsibility.

use crate::core::types::{Position, Direction, CoreResult, CoreError};
use crate::core::buffer::TextBuffer;

/// Cursor state
/// 
/// Tracks the current position in the buffer. The cursor is always
/// associated with a specific buffer and must be kept in sync.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Cursor {
    position: Position,
    /// Desired column when moving up/down (maintains horizontal position)
    desired_column: usize,
}

impl Cursor {
    /// Create a new cursor at the start of the document
    pub fn new() -> Self {
        Self {
            position: Position::zero(),
            desired_column: 0,
        }
    }

    /// Get the current position
    pub fn position(&self) -> Position {
        self.position
    }

    /// Set the cursor position
    pub fn set_position(&mut self, pos: Position) {
        self.position = pos;
        self.desired_column = pos.column;
    }

    /// Move the cursor in the given direction
    /// 
    /// Returns true if the cursor moved, false if it was at the boundary
    pub fn move_cursor(&mut self, direction: Direction, buffer: &TextBuffer) -> CoreResult<bool> {
        let new_pos = match direction {
            Direction::Left => self.move_left(buffer)?,
            Direction::Right => self.move_right(buffer)?,
            Direction::Up => self.move_up(buffer)?,
            Direction::Down => self.move_down(buffer)?,
            Direction::LineStart => self.move_line_start(),
            Direction::LineEnd => self.move_line_end(buffer)?,
            Direction::DocumentStart => Some(Position::zero()),
            Direction::DocumentEnd => self.move_document_end(buffer)?,
        };

        if let Some(pos) = new_pos {
            self.position = pos;
            
            // Update desired column for horizontal movements
            match direction {
                Direction::Left | Direction::Right | Direction::LineStart | Direction::LineEnd => {
                    self.desired_column = pos.column;
                }
                _ => {}
            }
            
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Move cursor left by one character
    fn move_left(&self, buffer: &TextBuffer) -> CoreResult<Option<Position>> {
        if self.position.column > 0 {
            Ok(Some(Position::new(self.position.line, self.position.column - 1)))
        } else if self.position.line > 0 {
            // Move to end of previous line
            let prev_line = self.position.line - 1;
            let line_len = buffer.line_length(prev_line)?;
            Ok(Some(Position::new(prev_line, line_len)))
        } else {
            Ok(None) // At start of document
        }
    }

    /// Move cursor right by one character
    fn move_right(&self, buffer: &TextBuffer) -> CoreResult<Option<Position>> {
        let line_len = buffer.line_length(self.position.line)?;
        
        if self.position.column < line_len {
            Ok(Some(Position::new(self.position.line, self.position.column + 1)))
        } else if self.position.line + 1 < buffer.line_count() {
            // Move to start of next line
            Ok(Some(Position::new(self.position.line + 1, 0)))
        } else {
            Ok(None) // At end of document
        }
    }

    /// Move cursor up by one line
    fn move_up(&self, buffer: &TextBuffer) -> CoreResult<Option<Position>> {
        if self.position.line == 0 {
            return Ok(None);
        }

        let new_line = self.position.line - 1;
        let line_len = buffer.line_length(new_line)?;
        let new_column = self.desired_column.min(line_len);
        
        Ok(Some(Position::new(new_line, new_column)))
    }

    /// Move cursor down by one line
    fn move_down(&self, buffer: &TextBuffer) -> CoreResult<Option<Position>> {
        let new_line = self.position.line + 1;
        
        if new_line >= buffer.line_count() {
            return Ok(None);
        }

        let line_len = buffer.line_length(new_line)?;
        let new_column = self.desired_column.min(line_len);
        
        Ok(Some(Position::new(new_line, new_column)))
    }

    /// Move cursor to start of current line
    fn move_line_start(&self) -> Option<Position> {
        if self.position.column == 0 {
            None
        } else {
            Some(Position::new(self.position.line, 0))
        }
    }

    /// Move cursor to end of current line
    fn move_line_end(&self, buffer: &TextBuffer) -> CoreResult<Option<Position>> {
        let line_len = buffer.line_length(self.position.line)?;
        
        if self.position.column == line_len {
            Ok(None)
        } else {
            Ok(Some(Position::new(self.position.line, line_len)))
        }
    }

    /// Move cursor to end of document
    fn move_document_end(&self, buffer: &TextBuffer) -> CoreResult<Option<Position>> {
        let last_line = buffer.line_count().saturating_sub(1);
        let line_len = buffer.line_length(last_line)?;
        let end_pos = Position::new(last_line, line_len);
        
        if self.position == end_pos {
            Ok(None)
        } else {
            Ok(Some(end_pos))
        }
    }

    /// Clamp cursor position to valid bounds
    /// 
    /// This is useful after buffer modifications that might invalidate the cursor
    pub fn clamp_to_buffer(&mut self, buffer: &TextBuffer) -> CoreResult<()> {
        if buffer.is_empty() {
            self.position = Position::zero();
            self.desired_column = 0;
            return Ok(());
        }

        // Clamp line
        let max_line = buffer.line_count().saturating_sub(1);
        if self.position.line > max_line {
            self.position.line = max_line;
        }

        // Clamp column
        let line_len = buffer.line_length(self.position.line)?;
        if self.position.column > line_len {
            self.position.column = line_len;
        }

        self.desired_column = self.position.column;
        Ok(())
    }
}

impl Default for Cursor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cursor_movement() {
        let buffer = TextBuffer::from_str("Hello\nWorld");
        let mut cursor = Cursor::new();

        // Move right
        assert!(cursor.move_cursor(Direction::Right, &buffer).unwrap());
        assert_eq!(cursor.position(), Position::new(0, 1));

        // Move down
        assert!(cursor.move_cursor(Direction::Down, &buffer).unwrap());
        assert_eq!(cursor.position(), Position::new(1, 1));

        // Move to line start
        assert!(cursor.move_cursor(Direction::LineStart, &buffer).unwrap());
        assert_eq!(cursor.position(), Position::new(1, 0));
    }

    #[test]
    fn test_cursor_boundaries() {
        let buffer = TextBuffer::from_str("Test");
        let mut cursor = Cursor::new();

        // Can't move up from first line
        assert!(!cursor.move_cursor(Direction::Up, &buffer).unwrap());
        
        // Can't move left from start
        assert!(!cursor.move_cursor(Direction::Left, &buffer).unwrap());
    }
}
