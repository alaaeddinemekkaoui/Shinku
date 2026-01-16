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
**Phase 2 complete!** ✅ File dialogs, line numbers, find/replace, and improved scrolling working.

## 🏗️ How it's Built

**Tech Stack:**
- Language: Rust (obviously)
- UI: Slint (native, not Electron!)
- Text Buffer: Rope data structure (ropey crate)


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
```

The core editor logic has tests. UI stuff is tested manually for now.

## 📝 License

MIT - Do whatever you want with it

## 🙏 Credits

- **ropey** - Text buffer library
- **Slint** - UI framework
- **Final Fantasy & Zelda** - Name inspiration ⚔️🔥

---

**Status:** Phase 2 Complete ✅ (v0.1) - Production ready for basic text editing!  
**Language:** 100% Rust  
**Fun level:** High 🔥  
**Next Phase**: Phase 3 - UI Polish & Settings (estimated 4-6 weeks)