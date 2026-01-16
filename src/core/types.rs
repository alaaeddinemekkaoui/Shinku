/// Core types used throughout the editor
use std::fmt;

/// Represents a position in the text buffer
/// 
/// Both line and column are 0-indexed internally for easier computation,
/// but displayed as 1-indexed to users.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Position {
    pub line: usize,
    pub column: usize,
}

impl Position {
    pub fn new(line: usize, column: usize) -> Self {
        Self { line, column }
    }

    pub fn zero() -> Self {
        Self { line: 0, column: 0 }
    }

    /// Convert to 1-indexed for display
    pub fn to_display(&self) -> (usize, usize) {
        (self.line + 1, self.column + 1)
    }
}

impl fmt::Display for Position {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let (line, col) = self.to_display();
        write!(f, "Ln {}, Col {}", line, col)
    }
}

/// Direction for cursor movement
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Direction {
    Up,
    Down,
    Left,
    Right,
    LineStart,
    LineEnd,
    DocumentStart,
    DocumentEnd,
}

/// Result type for core operations
pub type CoreResult<T> = Result<T, CoreError>;

/// Core editor errors
#[derive(Debug, thiserror::Error)]
pub enum CoreError {
    #[error("Invalid position: line {0}, column {1}")]
    InvalidPosition(usize, usize),
    
    #[error("Buffer is empty")]
    EmptyBuffer,
    
    #[error("Invalid operation: {0}")]
    InvalidOperation(String),
}
