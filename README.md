# 🔥 Project Phoenix

**Version:** 0.1 *(Yes, it's 0.1 — why not!)*

## What is Project Phoenix?
A text editor written in Rust. Name inspired by Final Fantasy and Zelda (might change later when it hits version 1).

## Why?
- It's a fun project to work on
- Because it's Rust… and Rust is cool
- Learning by doing something meaningful

## What's the purpose?
- Learn Rust while building something fun
- Create a fast, native text editor
- Have some fun along the way

## Current Status
Phase 1 complete! Basic editing works, but still early days.

## 🏗️ How it's Built

**Tech Stack:**
- Language: Rust (obviously)
- UI: Slint (native, not Electron!)
- Text Buffer: Rope data structure (ropey crate)

**Architecture:**
```
UI (Slint) → App (Controller) → Core (Editor) → Platform (File I/O)
```

Simple layers that keep things clean and testable.

**What's Inside:**
- `src/core/` - Text editing logic (buffer, cursor, undo)
- `src/app/` - Application state and commands
- `src/ui/` - Slint UI files
- `src/platform/` - File I/O and OS stuff

## 📂 File Structure

```
project-phoenix/
├── Cargo.toml         # Rust dependencies
├── src/
│   ├── main.rs        # Entry point
│   ├── core/          # Editor logic
│   ├── app/           # Commands & state
│   ├── ui/            # Slint UI
│   └── platform/      # File I/O
└── README.md          # You're here!
```

## 🚀 Building and Running

### Prerequisites

- **Rust**: 1.70 or later
- **Cargo**: Included with Rust

### Build

```bash
cargo build --release
```

### Run

```bash
cargo run --release
``` & Run

**Prerequisites:** Rust installed (from https://rustup.rs/)

```bash
# Build it
cargo build --release

# Run it
cargo run --release

# Test it
cargo test
- **Cold start**: <100ms
- **UI initialization**: <50ms
- **Total**: <20

- **Startup:** <200ms
- **Memory:** ~6 MB base
- **Large files:** Uses rope structure for fast edits
- **Binary size:** ~8 MB (release buildsition
- Document title with modified indicator
- Visual undo/redo indicators

## 🛣️ Roadmap

### Phase 2 - Usability (Next)
- [ ] File open/save dialogs
- [ ] Find and replace
- [ ] Line numbers
- [ ] Settings/preferences
- [ ] Improved scrolling
- [ ] Status messages

###✨ What Works (v0.1)

- ✅ Type text
- ✅ Cursor movement (arrow keys, Home, End)
- ✅ Backspace/Delete
- ✅ Enter for new lines
- ✅ Undo/Redo (Ctrl+Z, Ctrl+Y)
- ✅ Save (Ctrl+S)
- ✅ Status bar with cursor position
- ⚠️ Text display (working on making it visible!)
- [ ] Vim/Emacs keybindings
- [ ] Terminal integration

## 🔧 Technical Decisions

### Why Rope (ropey)?

Traditional text editors use gap buffers or piece tables. We use a **rope** because:

1. **EfTODO

**Next up:**
- [ ] Fix text display (can't see what you type!)
- [ ] Better scrolling
- [ ] File open/save dialogs
- [ ] Line numbers
- [ ] Find/replace

**Future (maybe):**
- [ ] Syntax highlighting
- [ ] Multiple cursors
- [ ] Tabs
- [ ] Themes
- [🤔 Why These Choices?

**Rust:** Fast, safe, and fun to learn

**Slint (not Electron):** 
- Native UI, not a browser
- <10 MB vs 100+ MB
- Actually feels like a real app

**Rope data structure:** 
- Fast insertions anywhere in the file
- Used by pro editors like Helix

**Clean architecture:**
- Makes it easier to add features
- Can test things without running the whole app
    pub fn delete_line(&mut self) -> CoreResult<()> {
        let pos = self.cursor.position();
        // Implementation...
        Ok(())
    }
}

// 2. Add to app/controller.rs
impl AppController {
    pub fn delete_line(&mut self) -> Result<()> {
        self.state.editor_mut().delete_line()?;
        Ok(())
    }
}

```bash
cargo test
```

The core editor logic has tests. UI stuff is tested manually for now.📝 License

MIT - Do whatever you want with it

## 🙏 Credits

- **ropey** - Text buffer library
- **Slint** - UI framework
- **Final Fantasy & Zelda** - Name inspiration ⚔️🔥

---

**Status:** Early days (v0.1) but it works! (mostly)  
**Language:** 100% Rust  
**Fun level:** High 🔥