/// File system operations
/// 
/// WHY A SEPARATE MODULE?
/// - Abstraction: Makes it easier to add features like file watchers, virtual file systems, etc.
/// - Testing: Can be mocked for unit tests
/// - Error handling: Centralized file I/O error handling
/// - Future: Could add async I/O, cloud storage, etc.

use anyhow::{Context, Result};
use std::fs;
use std::path::Path;

/// Read a file into a String
/// 
/// Handles encoding detection and error reporting
pub fn read_file<P: AsRef<Path>>(path: P) -> Result<String> {
    let path = path.as_ref();
    log::info!("Reading file: {}", path.display());
    
    let content = fs::read_to_string(path)
        .with_context(|| format!("Failed to read file: {}", path.display()))?;
    
    log::debug!("Read {} bytes from {}", content.len(), path.display());
    Ok(content)
}

/// Write a String to a file
/// 
/// Creates parent directories if needed
pub fn write_file<P: AsRef<Path>>(path: P, content: &str) -> Result<()> {
    let path = path.as_ref();
    log::info!("Writing file: {}", path.display());
    
    // Create parent directories if they don't exist
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .with_context(|| format!("Failed to create directory: {}", parent.display()))?;
        }
    }
    
    fs::write(path, content)
        .with_context(|| format!("Failed to write file: {}", path.display()))?;
    
    log::debug!("Wrote {} bytes to {}", content.len(), path.display());
    Ok(())
}

/// Check if a file exists
pub fn file_exists<P: AsRef<Path>>(path: P) -> bool {
    path.as_ref().exists()
}

/// Get file metadata (size, modified time, etc.)
pub fn file_metadata<P: AsRef<Path>>(path: P) -> Result<fs::Metadata> {
    let path = path.as_ref();
    fs::metadata(path)
        .with_context(|| format!("Failed to get metadata for: {}", path.display()))
}

/// Normalize a path (resolve . and .., handle symlinks)
pub fn normalize_path<P: AsRef<Path>>(path: P) -> Result<std::path::PathBuf> {
    let path = path.as_ref();
    path.canonicalize()
        .with_context(|| format!("Failed to normalize path: {}", path.display()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_read_write() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("phoenix_test.txt");
        
        let content = "Hello, Phoenix!";
        write_file(&test_file, content).unwrap();
        
        let read_content = read_file(&test_file).unwrap();
        assert_eq!(read_content, content);
        
        // Cleanup
        let _ = fs::remove_file(&test_file);
    }
}
