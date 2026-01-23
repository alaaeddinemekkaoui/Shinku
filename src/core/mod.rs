/// Core editor module
/// 
/// This module contains the pure editor logic with no dependencies on UI or platform code.
/// All types here are testable without instantiating a UI framework.

pub mod types;
pub mod buffer;
pub mod cursor;
pub mod selection;
pub mod undo;
pub mod editor;

// Re-export commonly used types
pub use types::{Position, Direction};
pub use editor::Editor;
