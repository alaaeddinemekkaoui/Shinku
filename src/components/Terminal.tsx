import React, { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import "../styles/terminal.css";

interface TerminalProps {
  isOpen: boolean;
  currentFilePath?: string;
  onClose?: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ isOpen, currentFilePath = "", onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandBufferRef = useRef<string>("");
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const cwdRef = useRef<string>("");
  const shellRef = useRef<string>("powershell");

  useEffect(() => {
    if (!terminalRef.current || !isOpen) return;

    // Initialize xterm.js
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"Cascadia Code", "Courier New", monospace',
      theme: {
        background: "#000000",
        foreground: "#e5e5e5",
        cursor: "#00d17a",
        cursorAccent: "#000000",
        black: "#000000",
        red: "#ff6b6b",
        green: "#00d17a",
        yellow: "#ffd93d",
        blue: "#6bcbff",
        magenta: "#ff6bff",
        cyan: "#6bffff",
        white: "#e5e5e5",
        brightBlack: "#6a6a6a",
        brightRed: "#ff8888",
        brightGreen: "#00ff9f",
        brightYellow: "#ffed4e",
        brightBlue: "#87ddff",
        brightMagenta: "#ff87ff",
        brightCyan: "#87ffff",
        brightWhite: "#ffffff",
      },
      scrollback: 1000,
      tabStopWidth: 4,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(terminalRef.current);

    fitAddon.fit();
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Initialize working directory
    initializeTerminal(term);

    // Handle terminal input
    term.onData((data) => {
      const code = data.charCodeAt(0);

      // Handle Enter key
      if (code === 13) {
        const command = commandBufferRef.current.trim();
        term.write("\r\n");

        if (command) {
          // Add to history
          historyRef.current.push(command);
          historyIndexRef.current = -1;

          // Handle built-in commands
          if (command === "clear" || command === "cls") {
            term.clear();
            writePrompt(term);
            commandBufferRef.current = "";
            return;
          }

          // Execute command
          executeCommand(term, command);
        } else {
          writePrompt(term);
        }

        commandBufferRef.current = "";
      }
      // Handle Backspace
      else if (code === 127 || code === 8) {
        if (commandBufferRef.current.length > 0) {
          commandBufferRef.current = commandBufferRef.current.slice(0, -1);
          term.write("\b \b");
        }
      }
      // Handle Ctrl+C
      else if (code === 3) {
        term.write("^C\r\n");
        writePrompt(term);
        commandBufferRef.current = "";
      }
      // Handle Ctrl+L (clear)
      else if (code === 12) {
        term.clear();
        writePrompt(term);
        commandBufferRef.current = "";
      }
      // Handle Arrow Up (history)
      else if (data === "\x1b[A") {
        if (historyRef.current.length > 0) {
          if (historyIndexRef.current < historyRef.current.length - 1) {
            historyIndexRef.current++;
          }
          const cmd = historyRef.current[historyRef.current.length - 1 - historyIndexRef.current];
          // Clear current line
          term.write("\r\x1b[K");
          writePrompt(term, false);
          term.write(cmd);
          commandBufferRef.current = cmd;
        }
      }
      // Handle Arrow Down (history)
      else if (data === "\x1b[B") {
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const cmd = historyRef.current[historyRef.current.length - 1 - historyIndexRef.current];
          term.write("\r\x1b[K");
          writePrompt(term, false);
          term.write(cmd);
          commandBufferRef.current = cmd;
        } else if (historyIndexRef.current === 0) {
          historyIndexRef.current = -1;
          term.write("\r\x1b[K");
          writePrompt(term);
          commandBufferRef.current = "";
        }
      }
      // Handle Tab (could add auto-complete later)
      else if (code === 9) {
        // Tab key - ignore for now
      }
      // Handle regular characters
      else if (code >= 32 && code < 127) {
        commandBufferRef.current += data;
        term.write(data);
      }
    });

    // Listen for real-time terminal output
    const unlistenOutput = listen<string>("terminal-output", (event) => {
      if (xtermRef.current) {
        xtermRef.current.writeln(event.payload);
      }
    });

    const unlistenComplete = listen<boolean>("terminal-complete", (event) => {
      if (xtermRef.current) {
        writePrompt(xtermRef.current);
      }
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      unlistenOutput.then(fn => fn());
      unlistenComplete.then(fn => fn());
      term.dispose();
    };
  }, [isOpen]);

  const initializeTerminal = async (term: XTerm) => {
    try {
      // Get current working directory
      const cwd = await invoke<string>("get_current_directory", {});
      cwdRef.current = cwd;
      
      term.writeln("\x1b[1;36mWindows PowerShell\x1b[0m");
      term.writeln("\x1b[1;37mCopyright (C) Microsoft Corporation. All rights reserved.\x1b[0m");
      term.writeln("");
      term.writeln("\x1b[0;36mTry the new cross-platform PowerShell https://aka.ms/pscore6\x1b[0m");
      term.writeln("");
      writePrompt(term);
    } catch (error) {
      // Fallback if getting cwd fails
      cwdRef.current = "C:\\\\Users\\\\user";
      term.writeln("\x1b[1;32mShinku Terminal - Ready\x1b[0m");
      term.writeln("");
      writePrompt(term);
    }
  };

  const writePrompt = (term: XTerm, newline: boolean = true) => {
    const prompt = cwdRef.current || "C:\\\\Users\\\\user";
    if (shellRef.current === "powershell") {
      if (newline) {
        term.write(`\r\n\x1b[1;32mPS ${prompt}>\x1b[0m `);
      } else {
        term.write(`\x1b[1;32mPS ${prompt}>\x1b[0m `);
      }
    } else {
      if (newline) {
        term.write(`\r\n\x1b[1;37m${prompt}>\x1b[0m `);
      } else {
        term.write(`\x1b[1;37m${prompt}>\x1b[0m `);
      }
    }
  };

  const executeCommand = async (term: XTerm, command: string) => {
    try {
      // Command execution now streams output via events
      await invoke<string>("execute_terminal_command", {
        command,
        workingDir: cwdRef.current || "",
        shell: shellRef.current,
      });

      // Handle cd command to update working directory
      if (command.trim().toLowerCase().startsWith("cd ")) {
        try {
          const newCwd = await invoke<string>("get_current_directory", {});
          cwdRef.current = newCwd;
        } catch (e) {
          // Keep current directory if update fails
        }
      }
    } catch (error) {
      term.writeln(`\x1b[1;31m${error}\x1b[0m`);
      writePrompt(term);
    }
  };

  const handleClearTerminal = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      writePrompt(xtermRef.current, false);
      commandBufferRef.current = "";
    }
  };

  const handleOpenExternalTerminal = async () => {
    try {
      const workDir = currentFilePath
        ? currentFilePath.substring(0, currentFilePath.lastIndexOf("/"))
        : "";
      await invoke("open_external_terminal", { path: workDir });
    } catch (error) {
      if (xtermRef.current) {
        xtermRef.current.writeln(`\x1b[1;31mFailed to open external terminal: ${error}\x1b[0m`);
      }
    }
  };

  if (!isOpen) return null;

  if (!isOpen) return null;

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-title-section">
          <span className="terminal-icon">▶</span>
          <span className="terminal-title">TERMINAL</span>
        </div>
        <div className="terminal-actions">
          <button
            className="terminal-action-btn"
            onClick={handleClearTerminal}
            title="Clear terminal (Ctrl+L)"
          >
            Clear
          </button>
          <button
            className="terminal-action-btn"
            onClick={handleOpenExternalTerminal}
            title="Open in external terminal"
          >
            External
          </button>
          <button
            className="terminal-action-btn terminal-close"
            onClick={onClose}
            title="Close terminal"
          >
            ✕
          </button>
        </div>
      </div>
      <div ref={terminalRef} className="terminal-content" />
    </div>
  );
};

export default Terminal;
