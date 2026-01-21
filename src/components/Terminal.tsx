import React, { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "../styles/terminal.css";

interface TerminalProps {
  isOpen: boolean;
  currentFilePath?: string;
  onClose?: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ isOpen, currentFilePath = "", onClose }) => {
  const [output, setOutput] = useState<string[]>([
    "Welcome to Shinku 神紅 Terminal",
    "Type commands below...",
    "",
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleCommandSubmit = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const command = input.trim();
      
      if (!command) return;

      // Add to output
      setOutput(prev => [...prev, `> ${command}`]);
      setHistory(prev => [...prev, command]);
      setHistoryIndex(-1);
      setInput("");

      try {
        // Execute command through Tauri
        const result = await invoke<string>("execute_terminal_command", {
          command,
          workingDir: currentFilePath ? currentFilePath.substring(0, currentFilePath.lastIndexOf("/")) : "",
        });
        setOutput(prev => [...prev, result, ""]);
      } catch (error) {
        setOutput(prev => [...prev, `Error: ${error}`, ""]);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex + 1 < history.length ? historyIndex + 1 : history.length - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  }, [input, history, historyIndex, currentFilePath]);

  const handleOpenExternalTerminal = async () => {
    try {
      const workDir = currentFilePath 
        ? currentFilePath.substring(0, currentFilePath.lastIndexOf("/")) 
        : "";
      await invoke("open_external_terminal", { path: workDir });
    } catch (error) {
      setOutput(prev => [...prev, `Failed to open external terminal: ${error}`, ""]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <span className="terminal-title">📟 Terminal</span>
        <div className="terminal-actions">
          <button 
            className="terminal-action-btn"
            onClick={handleOpenExternalTerminal}
            title="Open external terminal"
          >
            🖥️ External
          </button>
          <button
            className="terminal-action-btn"
            onClick={onClose}
            title="Close terminal"
          >
            ✕ Close
          </button>
        </div>
      </div>
      <div className="terminal-output" ref={outputRef}>
        {output.map((line, index) => (
          <div key={index} className="terminal-line">
            {line}
          </div>
        ))}
      </div>
      <div className="terminal-input-container">
        <span className="terminal-prompt">{'>'}</span>
        <input
          type="text"
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCommandSubmit}
          placeholder="Type command..."
          autoFocus
        />
      </div>
    </div>
  );
};

export default Terminal;
