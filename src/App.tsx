import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import Editor from "./components/Editor";
import LeftSidebar from "./components/LeftSidebar";
import FileHeader from "./components/FileHeader";
import StatusBar from "./components/StatusBar";
import FindReplace from "./components/FindReplace";

interface EditorState {
  content: string;
  title: string;
  is_modified: boolean;
  line_count: number;
  cursor_line: number;
  cursor_column: number;
}

function App() {
  const [editorState, setEditorState] = useState<EditorState>({
    content: "",
    title: "Untitled",
    is_modified: false,
    line_count: 1,
    cursor_line: 1,
    cursor_column: 1,
  });

  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [showFindReplace, setShowFindReplace] = useState(false);

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
      line_count: content.split("\n").length,
    }));

    // Sync to backend
    invoke("set_content", { content }).catch(console.error);
  }, []);

  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursorPos({ line, column });
  }, []);

  const handleNewFile = useCallback(async () => {
    try {
      const state = await invoke<EditorState>("new_file");
      setEditorState(state);
    } catch (error) {
      console.error("Failed to create new file:", error);
    }
  }, []);

  const handleOpenFile = useCallback(async () => {
    try {
      const state = await invoke<EditorState>("open_file");
      setEditorState(state);
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  }, []);

  const handleSaveFile = useCallback(async () => {
    try {
      const state = await invoke<EditorState>("save_file");
      setEditorState(state);
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  }, []);

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
      // Ctrl+H - Find & Replace
      else if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        setShowFindReplace(true);
      }
      // Escape - Close Find & Replace
      else if (e.key === 'Escape') {
        setShowFindReplace(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewFile, handleOpenFile, handleSaveFile, handleSaveFileAs, handleUndo, handleRedo]);

  return (
    <div className="app">
      <LeftSidebar
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onSaveFileAs={handleSaveFileAs}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onFindReplace={() => setShowFindReplace(true)}
        fileName={editorState.title}
      />
      <div className="main-content">
        <FileHeader
          title={editorState.title}
          isModified={editorState.is_modified}
        />
        <div className="editor-container">
          <Editor
            content={editorState.content}
            onChange={handleContentChange}
            onCursorChange={handleCursorChange}
          />
        </div>
        <StatusBar
          line={cursorPos.line}
          column={cursorPos.column}
          lineCount={editorState.line_count}
          isModified={editorState.is_modified}
        />
      </div>
      <FindReplace 
        isOpen={showFindReplace} 
        onClose={() => setShowFindReplace(false)} 
      />
    </div>
  );
}

export default App;
