# Shinku Text Editor

A modern, high-performance text editor built with Rust, Tauri, React, and CodeMirror.

## Quick Start

### 🚀 Fastest Way to Run (Recommended)

**Windows:**
```powershell
.\run.bat
```

**macOS/Linux:**
```bash
chmod +x run.sh
./run.sh
```

### 📦 Using npm Commands

```bash
npm start
```

Or the full command:
```bash
npm run tauri dev
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | **Best**: Start Tauri dev server |
| `npm run tauri dev` | Start Tauri development |
| `cargo build` | Build Rust backend |
| `cargo run` | Run Rust backend only |

## Features

The boring nerdy stuff (My Deep Apologies  )
✨ **Modern Editor**
- Syntax highlighting (JavaScript, Python, Rust, etc.)
- CodeMirror 6 integration with line numbers
- Full-screen scrollable editor
- Efficient rope-based text buffer

📁 **File Operations**
- New File (Ctrl+N)
- Open File (Ctrl+O)
- Open Folder (Ctrl+Shift+O)
- Save (Ctrl+S)
- Save As (Ctrl+Shift+S)
- Close File (Ctrl+W)

⌨️ **Keyboard Shortcuts**
- Full menu with dropdown shortcuts
- About menu with complete shortcut reference
- Edit: Undo, Redo, Cut, Copy, Paste, Find, Replace
- View: Zoom, Line Numbers, Toggle

🎨 **Modern UI**
- Dark theme (OneDark)
- Dropdown menus with icon support
- Modal dialogs for About & Shortcuts
- Real-time cursor position display

## Project Structure
The boring nerdy stuff 
```
Project phoenix/
├── src/                   # Rust backend
│   ├── main.rs           # Main entry point
│   ├── tauri_commands.rs # Tauri command handlers
│   ├── core/             # Text editor core
│   ├── app/              # Application controller
│   └── platform/         # File I/O
├── src/ (frontend)       # React + TypeScript
│   ├── components/       # React components
│   ├── App.tsx          # Main app
│   └── styles.css       # Global styles
├── config/               # Configuration
│   ├── shortcuts.json   # Keyboard shortcuts
│   └── about.json       # About information
├── package.json          # npm dependencies
├── Cargo.toml           # Rust dependencies
└── tauri.conf.json      # Tauri config
```

## Tech Stack

- **Backend:** Rust + Tauri
- **Frontend:** React + TypeScript + Vite
- **Editor:** CodeMirror 6
- **Text Buffer:** Ropey (rope data structure)
- **Theme:** OneDark

## Development

### Prerequisites
- Node.js 16+
- Rust 1.70+

### Installation
```bash
npm install
```

### Development Mode
```bash
npm start
```

This starts both the Vite dev server and Tauri in development mode with hot reload.

## Building for Release

```bash
npm run build
```

## License

MIT - See LICENSE file

## Author

**Alaa** - Built with ❤️ using Rust + Tauri + React + CodeMirror

---

**Philosophy:** From the ashes of complexity, rises simplicity. ✨

MIT - Do whatever you want with it

## 🙏 Credits

- **ropey** - Text buffer library
- **Slint** - UI framework
- **Final Fantasy & Zelda** - Name inspiration ⚔️🔥
