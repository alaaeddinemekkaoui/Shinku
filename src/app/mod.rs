/// Application layer
/// 
/// This layer sits between the core editor logic and the UI.
/// It manages application state and provides commands for common operations.

pub mod state;
pub mod commands;
pub mod controller;
pub mod app_info;

pub use controller::AppController;
