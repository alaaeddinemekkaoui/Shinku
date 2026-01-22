import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import Editor, { EditorHandle } from "./components/Editor";
import StatusBar from "./components/StatusBar";
import FindReplace from "./components/FindReplace";
import AboutDialog from "./components/AboutDialog";
import ShortcutsDialog from "./components/ShortcutsDialog";
import Terminal from "./components/Terminal";
import FileSidebar, { FileTab } from "./components/FileSidebar";
import FileTree, { TreeNode } from "./components/FileTree";
import Toast, { ToastMessage } from "./components/Toast";
import Sidebar from "./components/Sidebar";
import SearchPanel from "./components/SearchPanel";
import Header from "./components/Header";
import UnsavedChangesDialog from "./components/UnsavedChangesDialog";
import WelcomePage from "./components/WelcomePage";
import CommandPalette from "./components/CommandPalette";
import "./styles/app-new-layout.css";

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
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [openFiles, setOpenFiles] = useState<FileTab[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, EditorState>>({});
  const [folderTree, setFolderTree] = useState<TreeNode[]>([]);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [workspaceMode, setWorkspaceMode] = useState<'folder' | 'files' | null>(null); // 'folder' = full workspace, 'files' = files only
  const editorRef = useRef<EditorHandle | null>(null);
  
  // UI state
  const [sidebarActive, setSidebarActive] = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem("leftPanelWidth");
    const width = saved ? parseInt(saved, 10) : 300;
    return Math.min(Math.max(width, 180), 520);
  });
  const [ctrlKPressed, setCtrlKPressed] = useState(false);
  const [autoSaveEnabled] = useState(() => {
    const saved = localStorage.getItem('shinku-autosave');
    return saved ? JSON.parse(saved) : true;
  });
  const autoSaveTimerRef = useRef<number | null>(null);

  // Toast helper function
  const showToast = useCallback((message: string, type: "success" | "error" | "info" | "warning" = "info", duration = 3000) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);
  }, []);
  const unsavedFiles = openFiles.filter(f => f.isModified || !f.isSaved);

  const handleSaveFileAs = useCallback(async () => {
    try {
      const newPath = await invoke<string>("save_file_as");
      if (!newPath) return;
      
      const state = await invoke<EditorState>("get_editor_state");
      setEditorState(state);
      
      const fileName = newPath.split('/').pop() || newPath;
      
      if (activeFileId) {
        setOpenFiles(prev => prev.map(f =>
          f.id === activeFileId
            ? { ...f, isModified: false, isSaved: true, name: fileName, path: newPath }
            : f
        ));
        setFileContents(prev => ({
          ...prev,
          [activeFileId]: state
        }));
      }
      
      showToast(`File saved as "${fileName}"`, "success");
    } catch (error) {
      console.error("Failed to save file as:", error);
      showToast(`Failed to save file as: ${error}`, "error");
    }
  }, [activeFileId, showToast]);

  const handleSaveFile = useCallback(async () => {
    try {
      // Check if file is Untitled
      if (editorState.title === "Untitled") {
        await handleSaveFileAs();
        return;
      }
      
      const state = await invoke<EditorState>("save_file");
      setEditorState(state);
      if (activeFileId) {
        setOpenFiles(prev => prev.map(f =>
          f.id === activeFileId
            ? { ...f, isModified: false, isSaved: true, name: state.title.split('/').pop() || state.title }
            : f
        ));
      }
      showToast("File saved successfully", "success");
    } catch (error) {
      console.error("Failed to save file:", error);
      showToast(`Save failed: ${error}`, "error");
    }
  }, [editorState.title, activeFileId, showToast, handleSaveFileAs]);

  const handleCloseAll = useCallback(async () => {
    if (unsavedFiles.length > 0) {
      setShowUnsavedDialog(true);
      return;
    }
    // Close all without prompt
    setOpenFiles([]);
    setActiveFileId(null);
    setEditorState(prev => ({ ...prev, content: "", title: "Untitled", is_modified: false, is_saved: true }));
  }, [unsavedFiles]);

  const saveSelectedFiles = useCallback(async (ids: string[]) => {
    // Save selected unsaved files sequentially
    for (const id of ids) {
      const file = openFiles.find(f => f.id === id);
      if (!file) continue;
      setActiveFileId(id);
      // If file is Untitled or has no path, trigger Save As
      if (!file.path || file.name === "Untitled") {
        await handleSaveFileAs();
      } else {
        await handleSaveFile();
      }
    }
    setShowUnsavedDialog(false);
    // After saving, close all
    setOpenFiles([]);
    setActiveFileId(null);
    setEditorState(prev => ({ ...prev, content: "", title: "Untitled", is_modified: false, is_saved: true }));
  }, [openFiles, handleSaveFileAs, handleSaveFile]);

  const dontSaveAndClose = useCallback(() => {
    setShowUnsavedDialog(false);
    setOpenFiles([]);
    setActiveFileId(null);
    setEditorState(prev => ({ ...prev, content: "", title: "Untitled", is_modified: false, is_saved: true }));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch initial editor state
  useEffect(() => {
    invoke<EditorState>("get_editor_state")
      .then(setEditorState)
      .catch(console.error);
  }, []);

  // Persist left panel width
  useEffect(() => {
    localStorage.setItem("leftPanelWidth", String(leftPanelWidth));
  }, [leftPanelWidth]);

  const handleContentChange = useCallback((content: string) => {
    setEditorState((prev) => ({ ...prev, content, is_modified: true, is_saved: false }));

    if (activeFileId) {
      setOpenFiles(prev => prev.map(f =>
        f.id === activeFileId ? { ...f, isModified: true, isSaved: false } : f
      ));

      setFileContents(prev => ({
        ...prev,
        [activeFileId]: {
          ...(prev[activeFileId] || editorState),
          content,
          is_modified: true,
          is_saved: false,
        }
      }));
    }

    // Auto-save trigger
    if (autoSaveEnabled && activeFileId) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        const file = openFiles.find(f => f.id === activeFileId);
        if (file && file.path && file.path !== 'Untitled') {
          handleSaveFile();
        }
      }, 2000); // Auto-save after 2 seconds of inactivity
    }
  }, [activeFileId, editorState, autoSaveEnabled, openFiles, handleSaveFile]);

  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursorPos({ line, column });
  }, []);

  const addToRecentFiles = useCallback((path: string, name: string, type: 'file' | 'folder') => {
    const recentItems = JSON.parse(localStorage.getItem('shinku-recent-items') || '[]');
    const newItem = {
      id: path,
      name,
      type,
      path,
      lastOpened: Date.now()
    };
    const filtered = recentItems.filter((item: any) => item.path !== path);
    filtered.unshift(newItem);
    localStorage.setItem('shinku-recent-items', JSON.stringify(filtered.slice(0, 10)));
  }, []);

  const handleNewFile = useCallback(async () => {
    try {
      const state = await invoke<EditorState>("new_file");
      setEditorState(state);
      const fileId = Date.now().toString();
      const newFile: FileTab = {
        id: fileId,
        name: state.title,
        path: state.title,
        isActive: true,
        isModified: false,
        isSaved: true,
      };

      setOpenFiles(prev => [...prev.map(f => ({ ...f, isActive: false })), newFile]);
      setFileContents(prev => ({ ...prev, [fileId]: state }));
      setActiveFileId(fileId);
    } catch (error) {
      console.error("Failed to create new file:", error);
    }
  }, []);

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
      // Call backend to open file from specific path
      const state = await invoke<EditorState>("open_file_from_path", { filePath });
      if (!state || state.content === undefined) {
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
      
      // Add to recent files
      addToRecentFiles(filePath, fileName, 'file');
    } catch (error) {
      console.error("Failed to open file from path:", error);
      alert("Failed to open file: " + error);
    }
  }, [openFiles, activeFileId, handleSaveFile, addToRecentFiles]);

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
      
      // Add to recent files
      addToRecentFiles(state.title, newFile.name, 'file');
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  }, [openFiles, activeFileId, handleSaveFile, addToRecentFiles]);

  const handleCopy = useCallback(async () => {
    try {
      await editorRef.current?.copy();
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);

  const handleCut = useCallback(async () => {
    try {
      await editorRef.current?.cut();
    } catch (error) {
      console.error("Failed to cut:", error);
    }
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      await editorRef.current?.paste();
    } catch (error) {
      console.error("Failed to paste:", error);
    }
  }, []);

  const handleSelectAll = useCallback(() => {
    try {
      editorRef.current?.selectAll();
    } catch (error) {
      console.error("Failed to select all:", error);
    }
  }, []);

  const handleFind = useCallback(() => {
    setShowFindReplace(true);
  }, []);

  const handleGoToLine = useCallback(() => {
    const lineNum = prompt("Go to line number:");
    if (lineNum) {
      const num = parseInt(lineNum, 10);
      if (!isNaN(num) && num > 0) {
        showToast(`Go to line ${num} feature coming soon`, "info");
      }
    }
  }, [showToast]);

  const handleFormatDocument = useCallback(() => {
    showToast("Format document feature coming soon", "info");
  }, [showToast]);

  const buildCommands = useCallback(() => {
    return [
      {
        id: "cmd-new",
        label: "New File",
        description: "Create a new untitled file",
        category: "File",
        icon: "add_note",
        shortcut: "Ctrl+N",
        action: handleNewFile
      },
      {
        id: "cmd-open",
        label: "Open File",
        description: "Open an existing file",
        category: "File",
        icon: "folder_open",
        shortcut: "Ctrl+O",
        action: handleOpenFile
      },
      {
        id: "cmd-open-folder",
        label: "Open Folder",
        description: "Open a folder as workspace",
        category: "File",
        icon: "folder",
        shortcut: "Ctrl+Shift+O",
        action: handleOpenFolder
      },
      {
        id: "cmd-save",
        label: "Save File",
        description: "Save the current file",
        category: "File",
        icon: "save",
        shortcut: "Ctrl+S",
        action: handleSaveFile
      },
      {
        id: "cmd-save-as",
        label: "Save As",
        description: "Save file with a new name",
        category: "File",
        icon: "save_as",
        shortcut: "Ctrl+Shift+S",
        action: handleSaveFileAs
      },
      {
        id: "cmd-copy",
        label: "Copy",
        description: "Copy selected text to clipboard",
        category: "Edit",
        icon: "content_copy",
        shortcut: "Ctrl+C",
        action: handleCopy
      },
      {
        id: "cmd-cut",
        label: "Cut",
        description: "Cut selected text to clipboard",
        category: "Edit",
        icon: "content_cut",
        shortcut: "Ctrl+X",
        action: handleCut
      },
      {
        id: "cmd-paste",
        label: "Paste",
        description: "Paste from clipboard",
        category: "Edit",
        icon: "content_paste",
        shortcut: "Ctrl+V",
        action: handlePaste
      },
      {
        id: "cmd-select-all",
        label: "Select All",
        description: "Select entire document",
        category: "Edit",
        icon: "select_all",
        shortcut: "Ctrl+A",
        action: handleSelectAll
      },
      {
        id: "cmd-find",
        label: "Find",
        description: "Open find and replace",
        category: "Edit",
        icon: "search",
        shortcut: "Ctrl+F",
        action: handleFind
      },
      {
        id: "cmd-undo",
        label: "Undo",
        description: "Undo last change",
        category: "Edit",
        icon: "undo",
        shortcut: "Ctrl+Z",
        action: handleUndo
      },
      {
        id: "cmd-redo",
        label: "Redo",
        description: "Redo last undone change",
        category: "Edit",
        icon: "redo",
        shortcut: "Ctrl+Y",
        action: handleRedo
      },
      {
        id: "cmd-terminal",
        label: "Toggle Terminal",
        description: "Show or hide terminal",
        category: "View",
        icon: "terminal",
        shortcut: "Ctrl+`",
        action: () => setShowTerminal(!showTerminal)
      },
      {
        id: "cmd-shortcuts",
        label: "All Shortcuts",
        description: "Show keyboard shortcuts",
        category: "Help",
        icon: "keyboard",
        shortcut: "Ctrl+K Ctrl+S",
        action: () => setShowShortcuts(true)
      },
      {
        id: "cmd-preferences",
        label: "Preferences",
        description: "Open settings",
        category: "Help",
        icon: "settings",
        shortcut: "Ctrl+,",
        action: () => setShowPreferences(true)
      },
      {
        id: "cmd-about",
        label: "About",
        description: "About Shinku Editor",
        category: "Help",
        icon: "info",
        action: () => setShowAbout(true)
      }
    ];
  }, [showTerminal]);

  // Build commands array for command palette

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
      showToast(`Opened folder: ${response.folder_path}`, "success");
      
      // Add to recent files
      const folderName = response.folder_path.split(/[/\\]/).pop() || 'Unknown Folder';
      addToRecentFiles(response.folder_path, folderName, 'folder');
    } catch (error) {
      console.error('Failed to open folder:', error);
      showToast(`Failed to open folder: ${error}`, "error");
    }
  }, [showToast, addToRecentFiles]);

  const handleOpenFolderFromPath = useCallback(async (folderPath: string) => {
    try {
      const response = await invoke<FolderTreeResponse>('open_folder_from_path', { folderPath });
      if (!response || !response.folder_path) {
        console.error('Failed to open folder from path');
        return;
      }
      setCurrentFolderPath(response.folder_path);
      setFolderTree(convertToTreeNodes(response.entries));
      setWorkspaceMode('folder');
      showToast(`Opened folder: ${response.folder_path}`, "success");
      
      // Add to recent files
      const folderName = response.folder_path.split(/[/\\]/).pop() || 'Unknown Folder';
      addToRecentFiles(response.folder_path, folderName, 'folder');
    } catch (error) {
      console.error('Failed to open folder from path:', error);
      showToast(`Failed to open folder: ${error}`, "error");
    }
  }, [showToast, addToRecentFiles]);

  const handleCreateFolderWorkspace = useCallback(async () => {
    try {
      // Use open folder dialog to let user pick/create location
      const response = await invoke<FolderTreeResponse>('open_folder');
      if (!response || !response.folder_path) {
        console.error('No folder selected');
        return;
      }
      setCurrentFolderPath(response.folder_path);
      setFolderTree(convertToTreeNodes(response.entries));
      setWorkspaceMode('folder');
      showToast(`Created folder workspace: ${response.folder_path}`, "success");
      
      // Add to recent files
      const folderName = response.folder_path.split(/[/\\]/).pop() || 'Unknown Folder';
      addToRecentFiles(response.folder_path, folderName, 'folder');
    } catch (error) {
      console.error('Failed to create folder workspace:', error);
      showToast(`Failed to create workspace: ${error}`, "error");
    }
  }, [showToast, addToRecentFiles]);

  const handleCreateFilesWorkspace = useCallback(async () => {
    try {
      // Open file picker for multiple files
      const files = await invoke<string[]>('open_multiple_files');
      if (!files || files.length === 0) {
        console.error('No files selected');
        return;
      }

      // Set workspace mode to files-only first
      setWorkspaceMode('files');
      setCurrentFolderPath(''); // No folder in files-only workspace
      
      showToast(`Files workspace created with ${files.length} file(s)`, "success");
    } catch (error) {
      console.error('Failed to create files workspace:', error);
      showToast(`Failed to create workspace: ${error}`, "error");
    }
  }, [showToast]);

  // Update a specific node's children in the folder tree
  const updateTreeWithFolderEntries = (nodes: TreeNode[], targetPath: string, entries: DirectoryEntry[]): TreeNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        return { ...node, children: convertToTreeNodes(entries) };
      }
      if (node.children) {
        const updatedChildren = updateTreeWithFolderEntries(node.children, targetPath, entries);
        if (updatedChildren !== node.children) {
          return { ...node, children: updatedChildren };
        }
      }
      return node;
    });
  };

  const getParentPath = (path: string) => {
    if (!path) return "";
    const normalized = path.replace(/\\/g, '/');
    const parts = normalized.split('/');
    if (parts.length <= 1) return "";
    parts.pop();
    return parts.join('/');
  };

  // Refresh a folder tree for a given path. If `path` is omitted, refresh the current open folder.
  const refreshFolder = useCallback(async (path?: string) => {
    const targetPath = path || currentFolderPath;
    if (!targetPath) return;
    try {
      const response = await invoke<FolderTreeResponse>('refresh_folder_tree', { path: targetPath });
      if (path && path !== currentFolderPath) {
        setFolderTree(prev => updateTreeWithFolderEntries(prev, targetPath, response.entries));
      } else {
        setFolderTree(convertToTreeNodes(response.entries));
      }
    } catch (error) {
      console.error('Failed to refresh folder:', error);
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

  // Persist left panel width
  useEffect(() => {
    localStorage.setItem("leftPanelWidth", String(leftPanelWidth));
  }, [leftPanelWidth]);

  // Keyboard shortcuts handler with Ctrl+K tracking for Ctrl+K Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+` - Toggle Terminal
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setShowTerminal(!showTerminal);
      }
      // Ctrl+K Ctrl+S - Show Shortcuts
      else if (e.ctrlKey && e.key === 'k' && !ctrlKPressed) {
        e.preventDefault();
        setCtrlKPressed(true);
      }
      // Ctrl+N - New File
      else if (e.ctrlKey && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleNewFile();
      }
      // Ctrl+O - Open File
      else if (e.ctrlKey && e.key === 'o' && !e.shiftKey) {
        e.preventDefault();
        handleOpenFile();
      }
      // Ctrl+V - Paste
      else if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }
      // Ctrl+C - Copy
      else if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      }
      // Ctrl+X - Cut
      else if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        handleCut();
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
      // Ctrl+Shift+P - Command Palette
      else if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Ctrl+, - Preferences
      else if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setShowPreferences(true);
      }
      // Handle Ctrl+K Ctrl+S combo
      else if (ctrlKPressed && e.ctrlKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        setShowShortcuts(true);
        setCtrlKPressed(false);
      }
      // Escape - Close dialogs and reset Ctrl+K state
      else if (e.key === 'Escape') {
        setCtrlKPressed(false);
        setShowFindReplace(false);
        setShowAbout(false);
        setShowShortcuts(false);
        setShowPreferences(false);
      }
      // Reset Ctrl+K if another key is pressed
      else if (ctrlKPressed && !(e.ctrlKey && e.key === 's')) {
        setCtrlKPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ctrlKPressed, handleNewFile, handleOpenFile, handlePaste, handleCopy, handleCut, handleSaveFile, handleSaveFileAs, handleUndo, handleRedo, handleSelectFile, handleCloseFile, showTerminal]);

  // Resizable left panel
  const handleLeftPanelResize = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = Math.min(Math.max(startWidth + delta, 180), 520);
      setLeftPanelWidth(nextWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [leftPanelWidth]);

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
        {
          const newName = prompt(`Rename "${node.name}" to:`, node.name);
          if (newName && newName !== node.name && newName.trim()) {
            invoke('rename_file_or_folder', { old_path: node.path, new_name: newName })
              .then(() => {
                showToast(`Renamed to "${newName}"`, "success");
                // Refresh the parent folder to show renamed item
                refreshFolder(getParentPath(node.path));
              })
              .catch(err => {
                console.error('Failed to rename:', err);
                showToast(`Failed to rename: ${err}`, "error");
              });
          }
        }
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
          invoke('delete_file_or_folder', { path: node.path })
            .then(() => {
              // Close the file if it was open
              if (node.type === 'file') {
                setOpenFiles(prev => prev.filter(f => f.id !== node.id));
                if (activeFileId === node.id) {
                  setActiveFileId(null);
                }
              }
              showToast(`Deleted "${node.name}"`, "success");
              // Refresh the parent folder to remove deleted item
              refreshFolder(getParentPath(node.path));
            })
            .catch(err => {
              console.error('Failed to delete:', err);
              showToast(`Failed to delete: ${err}`, "error");
            });
        }
        break;
      case 'new-file':
        console.log('New file in folder not implemented yet');
        break;
      case 'new-folder':
        console.log('New folder not implemented yet');
        break;
    }
  }, [openFiles, activeFileId, editorState, handleSelectFile, refreshFolder]);

  return (
    <div className="app-new-layout">
      <Header
        onAbout={() => setShowAbout(true)}
        onSettings={() => setShowPreferences(true)}
        onTerminal={() => setShowTerminal(!showTerminal)}
        onShortcuts={() => setShowShortcuts(true)}
        onNew={handleNewFile}
        onOpen={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onSave={handleSaveFile}
        onSaveAs={handleSaveFileAs}
        onClose={handleCloseAll}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onFind={handleFind}
        onReplace={handleFind}
        onSelectAll={handleSelectAll}
        onGoToLine={handleGoToLine}
        onFormatDocument={handleFormatDocument}
      />
      
      <div className="main-layout">
        <div
          className={`sidebar-drawer ${sidebarActive || searchActive ? 'expanded' : 'collapsed'}`}
          style={{ width: sidebarActive || searchActive ? `${leftPanelWidth + 50}px` : '50px' }}
        >
          <Sidebar
            onToggleExplorer={() => {
              setSidebarActive(!sidebarActive);
              setSearchActive(false);
            }}
            onToggleSearch={() => {
              setSearchActive(!searchActive);
              setSidebarActive(false);
            }}
            explorerActive={sidebarActive}
            searchActive={searchActive}
          />

          <div className="sidebar-content" style={{ display: sidebarActive || searchActive ? 'flex' : 'none' }}>
            {searchActive ? (
              <SearchPanel isOpen={searchActive} />
            ) : sidebarActive ? (
              <FileTree
                nodes={folderTree.length ? folderTree : openFiles.map(f => ({
                  id: f.id,
                  name: f.name,
                  type: 'file',
                  path: f.path || f.id,
                }))}
                folderPath={currentFolderPath}
                activeFilePath={activeFileId || undefined}
                onOpenFile={handleOpenFile}
                onOpenFolder={handleOpenFolder}
                workspaceMode={workspaceMode}
                onFileSelect={(node) => {
                  if (node.type === 'file') {
                    handleOpenFileFromPath(node.path, node.name);
                  }
                }}
                onContextMenu={(node, action) => {
                  handleFileTreeContextMenu(node, action);
                }}
                onCreateFile={async (parentPath: string, fileName: string) => {
                  if (!fileName.trim() || !parentPath) return;

                  const parentNode = folderTree.find(node => node.path === parentPath);
                  const existsInParent = parentNode?.children?.some(child => child.name === fileName);
                  if (existsInParent) {
                    showToast(`A file named "${fileName}" already exists in this folder`, "warning");
                    return;
                  }

                  await invoke('create_file', { path: `${parentPath}/${fileName}` });
                  await refreshFolder(parentPath);
                }}
                onCreateFolder={async (parentPath: string, folderName: string) => {
                  if (!folderName.trim() || !parentPath) return;

                  const parentNode = folderTree.find(node => node.path === parentPath);
                  const existsInParent = parentNode?.children?.some(child => child.name === folderName);
                  if (existsInParent) {
                    showToast(`A folder named "${folderName}" already exists in this folder`, "warning");
                    return;
                  }

                  await invoke('create_folder', { path: `${parentPath}/${folderName}` });
                  await refreshFolder(parentPath);
                }}
              />
            ) : null}
          </div>
        </div>
        <div
          className="sidebar-resizer"
          style={{ display: sidebarActive || searchActive ? 'block' : 'none' }}
          onMouseDown={handleLeftPanelResize}
        />

        <div className="editor-main">
          {openFiles.length > 1 && (
            <FileSidebar
              files={openFiles}
              onFileSelect={handleSelectFile}
              onFileClose={handleCloseFile}
            />
          )}
          
          <div className="editor-container">
            {openFiles.length === 0 && !currentFolderPath ? (
              <WelcomePage
                onOpenFile={handleOpenFile}
                onOpenFolder={handleOpenFolder}
                onOpenRecent={(path) => {
                  if (path.endsWith('.md') || path.endsWith('.txt') || path.endsWith('.js') || path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.jsx')) {
                    handleOpenFileFromPath(path, path.split('/').pop() || path);
                  } else {
                    handleOpenFolderFromPath(path);
                  }
                }}
                onCreateFolderWorkspace={handleCreateFolderWorkspace}
                onCreateFilesWorkspace={handleCreateFilesWorkspace}
              />
            ) : (
              <>
                <Editor
                  ref={editorRef}
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
                  content={editorState.content}
                />
                {showTerminal && (
                  <Terminal
                    isOpen={showTerminal}
                    currentFilePath={editorState.title}
                    onClose={() => setShowTerminal(false)}
                  />
                )}
              </>
            )}
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
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={buildCommands()}
      />
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        files={unsavedFiles.map(f => ({ id: f.id, name: f.name }))}
        onSaveSelected={saveSelectedFiles}
        onDontSave={dontSaveAndClose}
        onCancel={() => setShowUnsavedDialog(false)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
