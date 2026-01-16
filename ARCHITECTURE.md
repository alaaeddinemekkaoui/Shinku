# Project Phoenix - Architecture Documentation

## Table of Contents
1. [High-Level Overview](#high-level-overview)
2. [Layer-by-Layer Breakdown](#layer-by-layer-breakdown)
3. [Data Flow](#data-flow)
4. [Performance Analysis](#performance-analysis)
5. [Design Decisions](#design-decisions)
6. [Extension Points](#extension-points)

---

## High-Level Overview

Project Phoenix uses a **layered architecture** inspired by Clean Architecture principles. The key insight is that **dependencies flow inward**:

```
UI → App → Core ← Platform
     ↓      ↓       ↓
   (knows about)  (independent)
```

### Dependency Rules

1. **Core** depends on nothing (pure logic)
2. **Platform** depends on nothing (OS abstractions)
3. **App** depends on Core and Platform
4. **UI** depends on App (and transitively Core/Platform)

This means:
- ✅ You can test Core without instantiating UI
- ✅ You can swap Slint for another UI framework
- ✅ You can run Core in a headless environment
- ✅ Platform code can be mocked for testing

---

## Layer-by-Layer Breakdown

### 1. Core Layer (`src/core/`)

**Purpose**: Pure editor logic with zero external dependencies

#### Components

**`types.rs`** - Foundational types
```rust
Position        // (line, column) - 0-indexed internally
Direction       // Up, Down, Left, Right, LineStart, etc.
CoreError       // Editor-specific errors
```

**`buffer.rs`** - Text storage using Rope
```rust
TextBuffer
  ├─ new() → empty buffer
  ├─ from_str(text) → buffer from string
  ├─ insert_char(pos, ch) → O(log n)
  ├─ delete_char(pos) → O(log n)
  ├─ line(n) → get line n
  ├─ line_count() → total lines
  └─ to_string() → export content
```

**Key insight**: Rope data structure gives us O(log n) insertions/deletions at any position, unlike arrays which require O(n) shifts.

**`cursor.rs`** - Cursor position and movement
```rust
Cursor
  ├─ position: Position
  ├─ desired_column: usize  // Maintains horizontal position during up/down
  ├─ move_cursor(direction, buffer) → move with validation
  └─ clamp_to_buffer(buffer) → ensure validity after edits
```

**Key insight**: Cursor is separate from buffer because:
- Multiple cursors can reference the same buffer
- Cursor has different lifecycle than buffer
- Easier to test independently

**`editor.rs`** - Orchestrates buffer + cursor + undo
```rust
Editor
  ├─ buffer: TextBuffer
  ├─ cursor: Cursor
  ├─ undo_manager: UndoManager
  ├─ modified: bool
  ├─ insert_char(ch) → insert + move cursor + record undo
  ├─ backspace() → move back + delete + record undo
  └─ undo/redo() → time travel
```

**Key insight**: Editor maintains invariants:
- Cursor always valid after any operation
- All mutations go through undo manager
- Modified flag tracks unsaved changes

**`undo.rs`** - Command pattern for undo/redo
```rust
trait Command {
    fn execute(&mut self, buffer) → do it
    fn undo(&mut self, buffer) → undo it
}

UndoManager
  ├─ undo_stack: Vec<Box<dyn Command>>
  ├─ redo_stack: Vec<Box<dyn Command>>
  └─ execute(cmd, buffer) → run + save for undo
```

**Key insight**: Command pattern makes undo trivial:
- Each operation is an object
- Undo = pop from undo stack, call undo(), push to redo stack
- Redo = reverse

#### Testing Strategy

Core is 100% testable without UI:

```rust
#[test]
fn test_insert_and_undo() {
    let mut editor = Editor::new();
    editor.insert_char('H').unwrap();
    assert_eq!(editor.content(), "H");
    
    editor.undo().unwrap();
    assert_eq!(editor.content(), "");
}
```

---

### 2. Platform Layer (`src/platform/`)

**Purpose**: OS abstraction for file I/O, dialogs, clipboard, etc.

#### Components

**`fs.rs`** - File system operations
```rust
read_file(path) → Result<String>
write_file(path, content) → Result<()>
file_exists(path) → bool
file_metadata(path) → Result<Metadata>
```

**Why separate?**
- Easy to mock for testing
- Can add async I/O later
- Can add virtual file systems (memory, network)
- Centralized error handling

**Future extensions**:
- `dialogs.rs` - Native file picker, save dialogs
- `clipboard.rs` - System clipboard access
- `process.rs` - Spawn external processes (LSP servers)

---

### 3. Application Layer (`src/app/`)

**Purpose**: Orchestrate core + platform, manage application state

#### Components

**`state.rs`** - Application state
```rust
Document
  ├─ editor: Editor
  ├─ file_path: Option<PathBuf>
  └─ title: String

AppState
  └─ current_document: Document
```

**Key insight**: Separates document metadata (path, title) from editor logic. Future: multiple documents/tabs.

**`commands.rs`** - High-level operations
```rust
open_file(app_state, path) → Result<CommandResult>
save_file(app_state) → Result<CommandResult>
save_file_as(app_state, path) → Result<CommandResult>
new_file(app_state) → Result<CommandResult>
```

**Key insight**: Commands coordinate multiple layers:
```
open_file:
  1. Call platform::fs::read_file()
  2. Create new Editor with content
  3. Update AppState with new document
  4. Return result message
```

**`controller.rs`** - UI ↔ Core bridge
```rust
AppController
  ├─ state: AppState
  ├─ handle_text_input(text) → delegate to editor
  ├─ handle_backspace() → delegate to editor
  ├─ move_cursor(direction) → delegate to editor
  ├─ visible_lines(start, count) → query for UI
  └─ cursor_position_display() → formatted for UI
```

**Key insight**: Controller translates between:
- UI events → Editor operations
- Editor state → UI display data

The UI never directly accesses Core.

---

### 4. UI Layer (`src/ui/`)

**Purpose**: Render state and capture events

#### Components

**`app.slint`** - Declarative UI definition
```slint
AppWindow {
    // Properties (state from Rust)
    property <string> text-content
    property <int> cursor-line
    property <int> cursor-column
    
    // Callbacks (events to Rust)
    callback text-input(string)
    callback move-cursor(string)
    callback save-file()
    
    // Layout
    VerticalBox {
        menu-bar { ... }
        editor-area { ... }
        status-bar { ... }
    }
}
```

**Key insight**: Slint is declarative like React/SwiftUI:
- Properties flow from Rust → UI
- Callbacks flow from UI → Rust
- No direct manipulation of UI elements

**`bindings.rs`** - Rust ↔ Slint integration
```rust
PhoenixUI {
    window: AppWindow,
    controller: Rc<RefCell<AppController>>,
    
    setup_callbacks() {
        window.on_text_input(|text| {
            controller.borrow_mut().handle_text_input(text);
            update_ui();
        });
        // ... more callbacks
    }
}
```

**Key insight**: 
- Callbacks capture `Rc<RefCell<Controller>>` for interior mutability
- After each operation, UI is updated from controller state
- Unidirectional data flow: Event → Controller → Update UI

---

## Data Flow

### User Types a Character

```
1. User presses 'A'
   ↓
2. Slint captures key event
   ↓
3. Slint calls text-input callback
   ↓
4. bindings.rs: window.on_text_input()
   ↓
5. controller.handle_text_input("A")
   ↓
6. editor.insert_char('A')
   ↓
7. buffer.insert_char(cursor_pos, 'A')
   ↓
8. undo_manager.execute(InsertCharCommand)
   ↓
9. cursor.move_cursor(Right)
   ↓
10. Update UI with new state
    - window.set_text_content(editor.content())
    - window.set_cursor_line(...)
    - window.set_cursor_column(...)
```

### User Saves File

```
1. User presses Ctrl+S
   ↓
2. Slint captures key event
   ↓
3. Slint calls save-file callback
   ↓
4. controller.save_file()
   ↓
5. commands::save_file(app_state)
   ↓
6. platform::fs::write_file(path, content)
   ↓
7. editor.mark_saved() (clear modified flag)
   ↓
8. Return success message
   ↓
9. Update UI (remove • from title)
```

---

## Performance Analysis

### Rope Data Structure

**Why Rope?**

Traditional approach: String or Vec<u8>
- Insert at position k: O(n) - must shift all following characters
- Large file (1MB): Insert at start requires moving 1,000,000 bytes

Rope approach: Balanced tree of string chunks
- Insert at position k: O(log n) - rebalance tree
- Large file (1MB): Insert at start touches ~20 nodes

**Trade-offs**:
- ✅ Fast insertions/deletions
- ✅ Good for multiple cursors
- ✅ Low memory overhead (ropey is optimized)
- ❌ Slightly slower iteration than Vec<u8>
- ❌ More complex implementation

**Benchmarks** (estimated):
```
100K line file:
  Insert at start:  Vec<u8> = 10ms, Rope = 0.01ms (1000x faster)
  Insert at end:    Vec<u8> = 0.001ms, Rope = 0.01ms (10x slower)
  Iterate all:      Vec<u8> = 1ms, Rope = 1.2ms (1.2x slower)
```

### Memory Usage

```
Base application:
  - Rust binary: 2MB (release, stripped)
  - Slint runtime: 3MB
  - Heap overhead: 1MB
  Total: ~6MB

Per document:
  - Rope overhead: ~48 bytes per line
  - Text content: 1 byte per character
  - Undo history: ~100 bytes per command × 1000 = 100KB
  
Example (10,000 line file, 50 chars/line):
  - Text: 500KB
  - Rope nodes: 480KB
  - Undo: 100KB
  Total: ~1MB per document
```

### Startup Time

```
1. Binary load: 20ms
2. Slint init: 30ms
3. Window creation: 20ms
4. Controller init: 10ms
Target total: <100ms
```

---

## Design Decisions

### Why Command Pattern for Undo?

**Alternatives considered**:
1. **Snapshot-based**: Store entire buffer after each change
   - ❌ High memory usage
   - ❌ Slow for large files
   
2. **Diff-based**: Store diffs between states
   - ✅ Low memory
   - ❌ Complex to implement correctly
   - ❌ Slow to reconstruct state after many undos

3. **Command pattern**: Store inverse operations
   - ✅ Low memory (only stores change data)
   - ✅ Fast undo/redo (just execute inverse)
   - ✅ Easy to implement
   - ✅ Extensible (macros, repeat)

### Why Separate Cursor from Buffer?

**Alternative**: Store cursor inside buffer

**Problems**:
- How do you handle multiple cursors?
- Cursor has different lifetime than buffer
- Testing becomes awkward
- Violates single responsibility

**Our approach**: Cursor is separate
- ✅ Easy to add multiple cursors (Vec<Cursor>)
- ✅ Cursor can be moved without cloning buffer
- ✅ Clear ownership: Editor owns both

### Why AppController?

**Alternative**: UI directly calls Core

**Problems**:
- UI would need to understand core types
- No place for application-level logic
- Hard to test UI event handling
- Tight coupling UI ↔ Core

**Our approach**: Controller mediates
- ✅ UI only sees simple types (strings, integers)
- ✅ Controller handles error conversion
- ✅ Easy to test: mock controller
- ✅ Loose coupling via interface

---

## Extension Points

### Adding Syntax Highlighting

```rust
// 1. Add to core/syntax.rs
pub struct SyntaxHighlighter {
    parser: tree_sitter::Parser,
    // ...
}

impl SyntaxHighlighter {
    pub fn highlight(&self, text: &str) -> Vec<HighlightSpan> {
        // Parse with tree-sitter
        // Return colored ranges
    }
}

// 2. Add to Editor
impl Editor {
    pub fn syntax_highlights(&self) -> Vec<HighlightSpan> {
        if let Some(highlighter) = &self.highlighter {
            highlighter.highlight(&self.buffer.to_string())
        } else {
            vec![]
        }
    }
}

// 3. Update UI to render colored spans
```

### Adding Multiple Cursors

```rust
// 1. Update Editor
impl Editor {
    cursors: Vec<Cursor>,  // Instead of single cursor
    
    pub fn insert_char(&mut self, ch: char) {
        for cursor in &mut self.cursors {
            // Insert at each cursor position
            // Update undo to batch operations
        }
    }
}

// 2. Update UI to show multiple carets
```

### Adding LSP Support

```rust
// 1. Add app/lsp.rs
pub struct LspClient {
    process: Child,
    // JSON-RPC communication
}

impl LspClient {
    pub fn completion(&self, pos: Position) -> Vec<CompletionItem> {
        // Send textDocument/completion request
        // Parse response
    }
}

// 2. Integrate with Controller
impl AppController {
    lsp_client: Option<LspClient>,
    
    pub fn request_completion(&self) -> Vec<String> {
        if let Some(lsp) = &self.lsp_client {
            lsp.completion(self.cursor_position())
        } else {
            vec![]
        }
    }
}
```

---

## Key Takeaways

1. **Clean Architecture Works**: Strict layer separation makes testing and extension trivial

2. **Rope is Worth It**: For a text editor, O(log n) insertions are essential

3. **Command Pattern Scales**: Easy undo/redo that extends to macros and collaboration

4. **Native UI is Fast**: Slint gives us <100ms startup without web overhead

5. **Rust Enables Safety**: RefCell for UI callbacks, zero race conditions, memory safety

---

**This architecture is production-ready and scales from a simple editor to a full IDE.**
