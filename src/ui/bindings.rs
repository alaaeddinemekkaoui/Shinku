// UI module - Slint bindings
//
// This module connects the Slint UI to the application controller.
// It translates Slint events into controller method calls and
// updates the UI with data from the controller.

use crate::app::AppController;
use crate::core::Direction;
use std::rc::Rc;
use std::cell::RefCell;

// Include the generated Slint code
slint::include_modules!();

/// UI manager that owns the Slint window and controller
pub struct PhoenixUI {
    window: AppWindow,
    controller: Rc<RefCell<AppController>>,
}

impl PhoenixUI {
    /// Create a new UI instance
    pub fn new() -> Result<Self, slint::PlatformError> {
        log::info!("Initializing Slint UI");
        
        let window = AppWindow::new()?;
        let controller = Rc::new(RefCell::new(AppController::new()));

        let ui = Self {
            window,
            controller,
        };

        ui.setup_callbacks();
        ui.update_ui();

        Ok(ui)
    }

    /// Set up all callbacks from Slint UI to controller
    fn setup_callbacks(&self) {
        let window = self.window.as_weak();
        let controller = self.controller.clone();

        // Handle text input
        self.window.on_text_input({
            let window = window.clone();
            let controller = controller.clone();
            move |text| {
                if let Err(e) = controller.borrow_mut().handle_text_input(text.as_str()) {
                    log::error!("Text input error: {}", e);
                }
                if let Some(window) = window.upgrade() {
                    update_window_from_controller(&window, &controller);
                }
            }
        });

        // Handle backspace
        self.window.on_backspace({
            let window = window.clone();
            let controller = controller.clone();
            move || {
                if let Err(e) = controller.borrow_mut().handle_backspace() {
                    log::error!("Backspace error: {}", e);
                }
                if let Some(window) = window.upgrade() {
                    update_window_from_controller(&window, &controller);
                }
            }
        });

        // Handle delete
        self.window.on_delete({
            let window = window.clone();
            let controller = controller.clone();
            move || {
                if let Err(e) = controller.borrow_mut().handle_delete() {
                    log::error!("Delete error: {}", e);
                }
                if let Some(window) = window.upgrade() {
                    update_window_from_controller(&window, &controller);
                }
            }
        });

        // Handle enter
        self.window.on_enter({
            let window = window.clone();
            let controller = controller.clone();
            move || {
                if let Err(e) = controller.borrow_mut().handle_enter() {
                    log::error!("Enter error: {}", e);
                }
                if let Some(window) = window.upgrade() {
                    update_window_from_controller(&window, &controller);
                }
            }
        });

        // Handle arrow keys
        self.window.on_move_cursor({
            let window = window.clone();
            let controller = controller.clone();
            move |direction_str| {
                let direction = match direction_str.as_str() {
                    "up" => Direction::Up,
                    "down" => Direction::Down,
                    "left" => Direction::Left,
                    "right" => Direction::Right,
                    "home" => Direction::LineStart,
                    "end" => Direction::LineEnd,
                    _ => return,
                };
                
                if let Err(e) = controller.borrow_mut().move_cursor(direction) {
                    log::error!("Cursor movement error: {}", e);
                }
                if let Some(window) = window.upgrade() {
                    update_window_from_controller(&window, &controller);
                }
            }
        });

        // Handle undo
        self.window.on_undo({
            let window = window.clone();
            let controller = controller.clone();
            move || {
                if let Err(e) = controller.borrow_mut().undo() {
                    log::error!("Undo error: {}", e);
                }
                if let Some(window) = window.upgrade() {
                    update_window_from_controller(&window, &controller);
                }
            }
        });

        // Handle redo
        self.window.on_redo({
            let window = window.clone();
            let controller = controller.clone();
            move || {
                if let Err(e) = controller.borrow_mut().redo() {
                    log::error!("Redo error: {}", e);
                }
                if let Some(window) = window.upgrade() {
                    update_window_from_controller(&window, &controller);
                }
            }
        });

        // Handle new file
        self.window.on_new_file({
            let window = window.clone();
            let controller = controller.clone();
            move || {
                if let Err(e) = controller.borrow_mut().new_file() {
                    log::error!("New file error: {}", e);
                }
                if let Some(window) = window.upgrade() {
                    update_window_from_controller(&window, &controller);
                }
            }
        });

        // Handle open file
        self.window.on_open_file({
            let window = window.clone();
            let controller = controller.clone();
            move || {
                log::info!("Open File clicked - showing file dialog");
                
                // Show native open file dialog
                if let Some(path) = rfd::FileDialog::new()
                    .add_filter("Text Files", &["txt", "md", "rs", "toml", "json", "xml", "py", "js", "ts", "html", "css"])
                    .add_filter("All Files", &["*"])
                    .set_title("Open File")
                    .pick_file()
                {
                    log::info!("Opening: {:?}", path);
                    match controller.borrow_mut().open_file(path) {
                        Ok(msg) => log::info!("{}", msg),
                        Err(e) => log::error!("Open error: {}", e),
                    }
                } else {
                    log::info!("Open File cancelled");
                }
                
                if let Some(window) = window.upgrade() {
                    update_window_from_controller(&window, &controller);
                }
            }
        });

        // Handle save
        self.window.on_save_file({
            let window = window.clone();
            let controller = controller.clone();
            move || {
                match controller.borrow_mut().save_file() {
                    Ok(msg) => log::info!("{}", msg),
                    Err(e) => log::error!("Save error: {}", e),
                }
                if let Some(window) = window.upgrade() {
                    update_window_from_controller(&window, &controller);
                }
            }
        });

        // Handle save as
        self.window.on_save_file_as({
            let window = window.clone();
            let controller = controller.clone();
            move || {
                log::info!("Save As clicked - showing file dialog");
                
                // Show native save file dialog
                if let Some(path) = rfd::FileDialog::new()
                    .add_filter("Text Files", &["txt", "md", "rs", "toml", "json", "xml"])
                    .add_filter("All Files", &["*"])
                    .set_title("Save File As")
                    .save_file()
                {
                    log::info!("Saving to: {:?}", path);
                    match controller.borrow_mut().save_file_as(path) {
                        Ok(msg) => log::info!("{}", msg),
                        Err(e) => log::error!("Save error: {}", e),
                    }
                } else {
                    log::info!("Save As cancelled");
                }
                
                if let Some(window) = window.upgrade() {
                    update_window_from_controller(&window, &controller);
                }
            }
        });

        // Handle new folder
        self.window.on_new_folder({
            let window = window.clone();
            let controller = controller.clone();
            move || {
                log::info!("New Folder clicked - feature coming soon!");
                // TODO: Implement folder creation dialog
                if let Some(window) = window.upgrade() {
                    update_window_from_controller(&window, &controller);
                }
            }
        });

        // Handle about
        self.window.on_show_about({
            move || {
                log::info!("About clicked");
                // Just set the flag to show the dialog - no file reading needed
                // The about dialog is now a popup component
            }
        });

        // Handle find text changed
        self.window.on_find_text_changed({
            let _window = window.clone();
            let _controller = controller.clone();
            move |find_text| {
                log::debug!("Find text changed: {}", find_text);
                // In a full implementation, would highlight matches in the text
                // For now, just log it
            }
        });

        // Handle replace all
        self.window.on_replace_all({
            let window = window.clone();
            let controller = controller.clone();
            move |find_text, replace_text| {
                let find_str = find_text.to_string();
                let replace_str = replace_text.to_string();
                
                if find_str.is_empty() {
                    log::warn!("Find text is empty");
                    return;
                }
                
                log::info!("Replace all '{}' with '{}'", find_str, replace_str);
                
                let content = controller.borrow().content();
                let new_content = content.replace(&find_str, &replace_str);
                
                if new_content != content {
                    // Clear document and insert new content
                    let mut ctrl = controller.borrow_mut();
                    ctrl.new_file().ok();
                    ctrl.set_content(&new_content);
                    drop(ctrl);
                    
                    log::info!("Replaced all occurrences");
                }
                
                if let Some(window) = window.upgrade() {
                    update_window_from_controller(&window, &controller);
                }
            }
        });

        // Handle close find
        self.window.on_close_find({
            let _window = window.clone();
            let _controller = controller.clone();
            move || {
                log::debug!("Find bar closed");
            }
        });
    }

    /// Update the UI with current controller state
    fn update_ui(&self) {
        update_window_from_controller(&self.window, &self.controller);
    }

    /// Run the UI event loop
    pub fn run(self) -> Result<(), slint::PlatformError> {
        log::info!("Starting UI event loop");
        self.window.run()
    }
}

/// Helper function to update the Slint window from the controller
fn update_window_from_controller(
    window: &AppWindow,
    controller: &Rc<RefCell<AppController>>,
) {
    let controller = controller.borrow();
    
    // Update content
    let content = controller.content();
    window.set_text_content(content.clone().into());
    
    // Generate line numbers based on content
    let line_count = content.lines().count().max(1);
    let line_numbers: String = (1..=line_count)
        .map(|n| n.to_string())
        .collect::<Vec<_>>()
        .join("\n");
    window.set_line_numbers(line_numbers.into());
    
    // Update cursor position
    let (line, col) = controller.cursor_position_display();
    window.set_cursor_line(line as i32);
    window.set_cursor_column(col as i32);
    
    // Update title
    window.set_document_title(controller.title().into());
    
    // Update status indicators
    window.set_is_modified(controller.is_modified());
    window.set_can_undo(controller.can_undo());
    window.set_can_redo(controller.can_redo());
}
