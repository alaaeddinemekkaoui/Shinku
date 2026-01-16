/// Selection support (placeholder for Phase 3+)
/// 
/// Selections will be needed for:
/// - Copy/paste
/// - Find/replace
/// - Multiple cursors
/// 
/// For now, we just define the types.

use crate::core::types::Position;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Selection {
    pub anchor: Position,
    pub cursor: Position,
}

impl Selection {
    pub fn new(anchor: Position, cursor: Position) -> Self {
        Self { anchor, cursor }
    }

    pub fn is_empty(&self) -> bool {
        self.anchor == self.cursor
    }

    pub fn start(&self) -> Position {
        self.anchor.min(self.cursor)
    }

    pub fn end(&self) -> Position {
        self.anchor.max(self.cursor)
    }
}
