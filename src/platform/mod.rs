/// Platform abstraction layer
/// 
/// This module contains platform-specific code and OS interactions.
/// Currently only file system operations, but could be extended to:
/// - Native file dialogs
/// - Clipboard operations
/// - System notifications
/// - Window management
/// - Process spawning

pub mod fs;

pub use fs::{read_file, write_file, file_exists};
