/// Undo/Redo system using Command pattern
/// 
/// WHY COMMAND PATTERN?
/// - Each edit operation is an object that can be undone
/// - Easy to implement undo/redo stacks
/// - Can be extended to support macros, repeat, etc.
/// 
/// This is a simplified version for Phase 1. In production, you'd want:
/// - Operation coalescing (combine sequential insertions)
/// - Memory limits on history
/// - Persistent undo (save undo history to disk)

use crate::core::buffer::TextBuffer;
use crate::core::types::{Position, CoreResult};

/// A command that can be executed and undone
pub trait Command: std::fmt::Debug {
    /// Execute the command, modifying the buffer
    fn execute(&mut self, buffer: &mut TextBuffer) -> CoreResult<()>;
    
    /// Undo the command, reverting the buffer
    fn undo(&mut self, buffer: &mut TextBuffer) -> CoreResult<()>;
}

/// Insert character command
#[derive(Debug, Clone)]
pub struct InsertCharCommand {
    position: Position,
    character: char,
}

impl InsertCharCommand {
    pub fn new(position: Position, character: char) -> Self {
        Self { position, character }
    }
}

impl Command for InsertCharCommand {
    fn execute(&mut self, buffer: &mut TextBuffer) -> CoreResult<()> {
        buffer.insert_char(self.position, self.character)
    }

    fn undo(&mut self, buffer: &mut TextBuffer) -> CoreResult<()> {
        buffer.delete_char(self.position)?;
        Ok(())
    }
}

/// Delete character command
#[derive(Debug, Clone)]
pub struct DeleteCharCommand {
    position: Position,
    deleted_char: Option<char>,
}

impl DeleteCharCommand {
    pub fn new(position: Position) -> Self {
        Self {
            position,
            deleted_char: None,
        }
    }
}

impl Command for DeleteCharCommand {
    fn execute(&mut self, buffer: &mut TextBuffer) -> CoreResult<()> {
        let ch = buffer.delete_char(self.position)?;
        self.deleted_char = Some(ch);
        Ok(())
    }

    fn undo(&mut self, buffer: &mut TextBuffer) -> CoreResult<()> {
        if let Some(ch) = self.deleted_char {
            buffer.insert_char(self.position, ch)?;
        }
        Ok(())
    }
}

/// Insert string command
#[derive(Debug, Clone)]
pub struct InsertStringCommand {
    position: Position,
    text: String,
}

impl InsertStringCommand {
    pub fn new(position: Position, text: String) -> Self {
        Self { position, text }
    }
}

impl Command for InsertStringCommand {
    fn execute(&mut self, buffer: &mut TextBuffer) -> CoreResult<()> {
        buffer.insert_str(self.position, &self.text)
    }

    fn undo(&mut self, buffer: &mut TextBuffer) -> CoreResult<()> {
        // Calculate end position after insertion
        let mut end_pos = self.position;
        for ch in self.text.chars() {
            if ch == '\n' {
                end_pos.line += 1;
                end_pos.column = 0;
            } else {
                end_pos.column += 1;
            }
        }
        buffer.delete_range(self.position, end_pos)?;
        Ok(())
    }
}

/// Undo/Redo manager
/// 
/// Maintains two stacks: one for undo, one for redo
#[derive(Debug)]
pub struct UndoManager {
    undo_stack: Vec<Box<dyn Command>>,
    redo_stack: Vec<Box<dyn Command>>,
    max_history: usize,
}

impl UndoManager {
    /// Create a new undo manager with a history limit
    pub fn new(max_history: usize) -> Self {
        Self {
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
            max_history,
        }
    }

    /// Execute a command and add it to the undo stack
    pub fn execute(&mut self, mut command: Box<dyn Command>, buffer: &mut TextBuffer) -> CoreResult<()> {
        command.execute(buffer)?;
        
        // Clear redo stack when a new command is executed
        self.redo_stack.clear();
        
        // Add to undo stack
        self.undo_stack.push(command);
        
        // Enforce history limit
        if self.undo_stack.len() > self.max_history {
            self.undo_stack.remove(0);
        }
        
        Ok(())
    }

    /// Undo the last command
    pub fn undo(&mut self, buffer: &mut TextBuffer) -> CoreResult<bool> {
        if let Some(mut command) = self.undo_stack.pop() {
            command.undo(buffer)?;
            self.redo_stack.push(command);
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Redo the last undone command
    pub fn redo(&mut self, buffer: &mut TextBuffer) -> CoreResult<bool> {
        if let Some(mut command) = self.redo_stack.pop() {
            command.execute(buffer)?;
            self.undo_stack.push(command);
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Check if undo is available
    pub fn can_undo(&self) -> bool {
        !self.undo_stack.is_empty()
    }

    /// Check if redo is available
    pub fn can_redo(&self) -> bool {
        !self.redo_stack.is_empty()
    }

    /// Clear all history
    pub fn clear(&mut self) {
        self.undo_stack.clear();
        self.redo_stack.clear();
    }
}

impl Default for UndoManager {
    fn default() -> Self {
        Self::new(1000) // 1000 operations by default
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_insert_undo() {
        let mut buffer = TextBuffer::new();
        let mut undo_mgr = UndoManager::new(100);
        
        let cmd = Box::new(InsertCharCommand::new(Position::zero(), 'H'));
        undo_mgr.execute(cmd, &mut buffer).unwrap();
        assert_eq!(buffer.to_string(), "H");
        
        undo_mgr.undo(&mut buffer).unwrap();
        assert_eq!(buffer.to_string(), "");
    }

    #[test]
    fn test_redo() {
        let mut buffer = TextBuffer::new();
        let mut undo_mgr = UndoManager::new(100);
        
        let cmd = Box::new(InsertCharCommand::new(Position::zero(), 'A'));
        undo_mgr.execute(cmd, &mut buffer).unwrap();
        
        undo_mgr.undo(&mut buffer).unwrap();
        assert_eq!(buffer.to_string(), "");
        
        undo_mgr.redo(&mut buffer).unwrap();
        assert_eq!(buffer.to_string(), "A");
    }
}
