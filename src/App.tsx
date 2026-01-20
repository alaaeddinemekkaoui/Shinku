import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import Editor from "./components/Editor";
import MenuBar from "./components/MenuBar";
import FileHeader from "./components/FileHeader";
import StatusBar from "./components/StatusBar";
import FindReplace from "./components/FindReplace";
import AboutDialog from "./components/AboutDialog";
import ShortcutsDialog from "./components/ShortcutsDialog";
import FileSidebar, { FileTab } from "./components/FileSidebar";
import FileTree, { TreeNode } from "./components/FileTree";

interface EditorState {
  content: string;
  title: string;
  is_modified: boolean;
  is_saved: boolean;  // Track if file is persisted to disk (from backend)
  line_count: number;
  cursor_line: number;
  cursor_column: number;
}

interface DirectoryEntry {
  id: string;
  name: string;
  entry_type: string;
  path: string;
  children?: DirectoryEntry[];
}

interface FolderTreeResponse {
  folder_path: string;
  entries: DirectoryEntry[];
}

/**
 * Convert DirectoryEntry (from Rust) to TreeNode (for UI)
 */
function convertToTreeNodes(entries: DirectoryEntry[]): TreeNode[] {
  return entries.map(entry => ({
    id: entry.id,
    name: entry.name,
    type: entry.entry_type === 'folder' ? 'folder' : 'file',
    path: entry.path,
    children: entry.children ? convertToTreeNodes(entry.children) : undefined,
  }));
}

function App() {
  const [editorState, setEditorState] = useState<EditorState>({
    content: "",
    title: "Untitled",
    is_modified: false,
    is_saved: true,  // New documents start as saved (clean state)
    line_count: 1,
    cursor_line: 1,
    cursor_column: 1,
  });

  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [openFiles, setOpenFiles] = useState<FileTab[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, EditorState>>({});
  const [folderTree, setFolderTree] = useState<TreeNode[]>([]);
  const [showFileTree, setShowFileTree] = useState(false);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("");

  // Fetch initial editor state
  useEffect(() => {
    invoke<EditorState>("get_editor_state")
      .then(setEditorState)
      .catch(console.error);
  }, []);

  const handleContentChange = useCallback((content: string) => {
    // Update local state immediately for smooth typing
    setEditorState((prev) => ({
      ...prev,
      content,
      is_modified: true,
      is_saved: false,  // Mark as unsaved in local state
    }));

    // Update file contents for active file
    if (activeFileId) {
      setOpenFiles(prev => prev.map(f => 
        f.id === activeFileId 
          ? { ...f, isModified: true, isSaved: false }
          : f
      ));
      setFileContents(prev => ({
        ...prev,
        [activeFileId]: {
          ...prev[activeFileId],
          content,
          is_modified: true,
          is_saved: false,
          line_count: content.split("\n").length,
        }
      }));
    }

    // Sync to backend - backend will mark as modified
    invoke("set_content", { content }).catch(console.error);
  }, [activeFileId]);

  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursorPos({ line, column });
  }, []);

  const handleNewFile = useCallback(async () => {
    try {
      const state = await invoke<EditorState>("new_file");
      setEditorState(state);
      const fileId = `untitled-${Date.now()}`;
      const newFile: FileTab = {
        id: fileId,
        name: state.title,
        path: state.title,
        isActive: true,
        isModified: false,
        isSaved: true
      };
      setOpenFiles(prev => [...prev.map(f => ({ ...f, isActive: false })), newFile]);
      setFileContents(prev => ({ ...prev, [fileId]: state }));
      setActiveFileId(fileId);
    } catch (error) {
      console.error("Failed to create new file:", error);
    }
  }, []);

  const handleSaveFile = useCallback(async () => {
    try {
      const state = await invoke<EditorState>("save_file");
      setEditorState(state);
      if (activeFileId) {
        setOpenFiles(prev => prev.map(f =>
          f.id === activeFileId
            ? { ...f, isModified: false, isSaved: true }
            : f
        ));
      }
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  }, [activeFileId]);

  const handleOpenFileFromPath = useCallback(async (filePath: string, fileName: string) => {
    // Check if active file has unsaved changes
    if (activeFileId) {
      const activeFile = openFiles.find(f => f.id === activeFileId);
      if (activeFile?.isModified) {
        const shouldSave = window.confirm(
          `Save changes to "${activeFile.name}" before opening another file?`
        );
        if (shouldSave) {
          await handleSaveFile();
        }
      }
    }

    try {
      // Call backend to open file - but we need to store the file path in the backend
      const state = await invoke<EditorState>("open_file_from_path", { filePath });
      if (!state || !state.content === undefined) {
        console.error("Failed to open file");
        return;
      }
      
      setEditorState(state);
      const fileId = filePath;
      const newFile: FileTab = {
        id: fileId,
        name: fileName,
        path: filePath,
        isActive: true,
        isModified: false,
        isSaved: true
      };
      
      // Check if file already open
      const existingFile = openFiles.find(f => f.id === fileId);
      if (existingFile) {
        setOpenFiles(prev => prev.map(f => ({ ...f, isActive: f.id === fileId })));
        setActiveFileId(fileId);
      } else {
        setOpenFiles(prev => [...prev.map(f => ({ ...f, isActive: false })), newFile]);
        setFileContents(prev => ({ ...prev, [fileId]: state }));
        setActiveFileId(fileId);
      }
    } catch (error) {
      console.error("Failed to open file from path:", error);
      alert("Failed to open file: " + error);
    }
  }, [openFiles, activeFileId, handleSaveFile]);

  const handleOpenFile = useCallback(async () => {
    // Check if active file has unsaved changes
    if (activeFileId) {
      const activeFile = openFiles.find(f => f.id === activeFileId);
      if (activeFile?.isModified) {
        const shouldSave = window.confirm(
          `Save changes to "${activeFile.name}" before opening another file?`
        );
        if (shouldSave) {
          await handleSaveFile();
        }
      }
    }

    try {
      const state = await invoke<EditorState>("open_file");
      if (!state || !state.title) {
        console.error("No file selected");
        return;
      }
      
      setEditorState(state);
      const fileId = state.title; // Use title as unique identifier
      const newFile: FileTab = {
        id: fileId,
        name: state.title.split('/').pop() || state.title,
        path: state.title,
        isActive: true,
        isModified: false,
        isSaved: true
      };
      
      // Check if file already open
      const existingFile = openFiles.find(f => f.id === fileId);
      if (existingFile) {
        setOpenFiles(prev => prev.map(f => ({ ...f, isActive: f.id === fileId })));
        setActiveFileId(fileId);
      } else {
        setOpenFiles(prev => [...prev.map(f => ({ ...f, isActive: false })), newFile]);
        setFileContents(prev => ({ ...prev, [fileId]: state }));
        setActiveFileId(fileId);
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  }, [openFiles, activeFileId, handleSaveFile]);

  const handleSaveFileAs = useCallback(async () => {
    try {
      const state = await invoke<EditorState>("save_file_as");
      setEditorState(state);
    } catch (error) {
      console.error("Failed to save file as:", error);
    }
  }, []);

  const handleUndo = useCallback(async () => {
    try {
      const state = await invoke<EditorState>("undo");
      setEditorState(state);
    } catch (error) {
      console.error("Failed to undo:", error);
    }
  }, []);

  const handleRedo = useCallback(async () => {
    try {
      const state = await invoke<EditorState>("redo");
      setEditorState(state);
    } catch (error) {
      console.error("Failed to redo:", error);
    }
  }, []);

  const handleSelectFile = useCallback((fileId: string) => {
    setActiveFileId(fileId);
    setOpenFiles(prev => prev.map(f => ({ ...f, isActive: f.id === fileId })));
    const fileContent = fileContents[fileId];
    if (fileContent) {
      setEditorState(fileContent);
    }
  }, [fileContents]);

  const handleCloseFile = useCallback(async (fileId: string) => {
    const fileToClose = openFiles.find(f => f.id === fileId);
    
    if (fileToClose?.isModified) {
      const shouldSave = window.confirm(
        `Save changes to "${fileToClose.name}" before closing?`
      );
      if (shouldSave) {
        await handleSaveFile();
      }
    }

    const newFiles = openFiles.filter(f => f.id !== fileId);
    setOpenFiles(newFiles);
    
    // Remove from file contents
    setFileContents(prev => {
      const newContents = { ...prev };
      delete newContents[fileId];
      return newContents;
    });

    // Switch to another file if this was active
    if (activeFileId === fileId) {
      if (newFiles.length > 0) {
        const nextFile = newFiles[newFiles.length - 1];
        handleSelectFile(nextFile.id);
      } else {
        setActiveFileId(null);
        setEditorState({
          content: "",
          title: "Untitled",
          is_modified: false,
          is_saved: true,
          line_count: 1,
          cursor_line: 1,
          cursor_column: 1,
        });
      }
    }
  }, [openFiles, activeFileId, handleSaveFile, handleSelectFile]);

  const handleOpenFolder = useCallback(async () => {
    try {
      const response = await invoke<FolderTreeResponse>('open_folder');
      if (!response || !response.folder_path || response.entries.length === 0) {
        console.error('No folder selected or folder is empty');
        return;
      }
      setCurrentFolderPath(response.folder_path);
      setFolderTree(convertToTreeNodes(response.entries));
      setShowFileTree(true);
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  }, []);

  const refreshFolderTree = useCallback(async () => {
    if (currentFolderPath) {
      try {
        const response = await invoke<FolderTreeResponse>('refresh_folder_tree');
        setFolderTree(convertToTreeNodes(response.entries));
      } catch (error) {
        console.error('Failed to refresh folder:', error);
      }
    }
  }, [currentFolderPath]);

  // Check for unsaved changes before quitting
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsavedFiles = openFiles.some(f => f.isModified);
      if (hasUnsavedFiles) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [openFiles]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N - New File
      if (e.ctrlKey && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleNewFile();
      }
      // Ctrl+O - Open File
      else if (e.ctrlKey && e.key === 'o' && !e.shiftKey) {
        e.preventDefault();
        handleOpenFile();
      }
      // Ctrl+S - Save File
      else if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        handleSaveFile();
      }
      // Ctrl+Shift+S - Save As
      else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleSaveFileAs();
      }
      // Ctrl+Z - Undo
      else if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y - Redo
      else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+F - Find & Replace
      else if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
      }
      // Ctrl+, - Preferences
      else if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setShowPreferences(true);
      }
      // Escape - Close dialogs
      else if (e.key === 'Escape') {
        setShowFindReplace(false);
        setShowAbout(false);
        setShowShortcuts(false);
        setShowPreferences(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewFile, handleOpenFile, handleSaveFile, handleSaveFileAs, handleUndo, handleRedo, handleSelectFile, handleCloseFile]);

  const handleFileTreeContextMenu = useCallback((node: TreeNode, action: string) => {
    switch (action) {
      case 'open':
        if (node.type === 'file') {
          // Open file in new tab
          const newFile: FileTab = {
            id: node.id,
            name: node.name,
            path: node.path,
            isActive: true,
            isDirty: false
          };
          const existingFile = openFiles.find(f => f.id === node.id);
          if (existingFile) {
            handleSelectFile(node.id);
          } else {
            setOpenFiles(prev => [...prev.map(f => ({ ...f, isActive: false })), newFile]);
            setFileContents(prev => ({ ...prev, [node.id]: editorState }));
            setActiveFileId(node.id);
          }
        }
        break;
      case 'reveal':
        // Reveal in file explorer (platform-specific)
        invoke('reveal_in_explorer', { path: node.path })
          .catch(err => console.error('Failed to reveal in explorer:', err));
        break;
      case 'copy-path':
        // Copy file path to clipboard
        navigator.clipboard.writeText(node.path)
          .catch(err => console.error('Failed to copy path:', err));
        break;
      case 'rename':
        console.log('Rename not implemented yet:', node.name);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
          invoke('delete_file_or_folder', { path: node.path })
            .then(() => {
              // Refresh folder tree
              handleOpenFolder();
            })
            .catch(err => console.error('Failed to delete:', err));
        }
        break;
      case 'new-file':
        console.log('New file in folder not implemented yet');
        break;
      case 'new-folder':
        console.log('New folder not implemented yet');
        break;
    }
  }, [openFiles, activeFileId, editorState, handleSelectFile, handleOpenFolder]);

  return (
    <div className="app">
      <div className="main-content">
        <MenuBar
          onNew={handleNewFile}
          onOpen={handleOpenFile}
          onSave={handleSaveFile}
          onSaveAs={handleSaveFileAs}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onFindReplace={() => setShowFindReplace(true)}
          onAbout={() => setShowAbout(true)}
          onShortcuts={() => setShowShortcuts(true)}
          onOpenFolder={handleOpenFolder}
          onPreferences={() => setShowPreferences(true)}
        />
        {openFiles.length > 0 && (
          <FileSidebar
            files={openFiles}
            onFileSelect={handleSelectFile}
            onFileClose={handleCloseFile}
          />
        )}
        <div className="editor-wrapper">
          {showFileTree && folderTree.length > 0 && (
            <FileTree
              nodes={folderTree}
              folderPath={currentFolderPath}
              activeFilePath={activeFileId || undefined}
              onFileSelect={(node) => {
                if (node.type === 'file') {
                  // Call the handler to open file from specific path
                  handleOpenFileFromPath(node.path, node.name);
                }
              }}
              onContextMenu={(node, action) => {
                handleFileTreeContextMenu(node, action);
              }}
              onCreateFile={async (parentPath: string, fileName: string) => {
                if (!fileName.trim() || !parentPath) return;
                try {
                  await invoke('create_file', { 
                    parentPath, 
                    fileName 
                  });
                  await refreshFolderTree();
                } catch (error) {
                  console.error('Failed to create file:', error);
                  alert('Failed to create file: ' + error);
                }
              }}
              onCreateFolder={async (parentPath: string, folderName: string) => {
                if (!folderName.trim() || !parentPath) return;
                try {
                  await invoke('create_folder', { 
                    parentPath, 
                    folderName 
                  });
                  await refreshFolderTree();
                } catch (error) {
                  console.error('Failed to create folder:', error);
                  alert('Failed to create folder: ' + error);
                }
              }}
            />
          )}
          <div className="editor-container">
            <FileHeader
              title={editorState.title}
              isModified={editorState.is_modified}
            />
            <Editor
              content={editorState.content}
              onChange={handleContentChange}
              onCursorChange={handleCursorChange}
            />
            <StatusBar
              line={cursorPos.line}
              column={cursorPos.column}
              lineCount={editorState.line_count}
              isModified={editorState.is_modified}
              filePath={editorState.title}
            />
          </div>
        </div>
      </div>
      <FindReplace 
        isOpen={showFindReplace} 
        onClose={() => setShowFindReplace(false)} 
      />
      <AboutDialog
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
      />
      <ShortcutsDialog
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
      {showPreferences && (
        <div className="preferences-overlay">
          <div className="preferences-dialog">
            <div className="preferences-header">
              <h2>Preferences</h2>
              <button className="close-btn" onClick={() => setShowPreferences(false)}>×</button>
            </div>
            <div className="preferences-content">
              <h3>Theme</h3>
              <p>Theme settings coming soon...</p>
            </div>
          </div>
        </div>
      )}
```
    </div>
  );
}

export default App;
