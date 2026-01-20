/// Application metadata and information
/// This file contains all essential information about Shinku Editor

pub const APP_NAME: &str = "Shinku";
pub const APP_VERSION: &str = "0.1.0";
pub const APP_EDITION: &str = "Tauri Edition";
pub const AUTHOR: &str = "Alaa Mekkaoui";
pub const LICENSE: &str = "MIT";
pub const REPOSITORY: &str = "https://github.com/alaaeddinemekkaoui/shinku";

pub const APP_DESCRIPTION: &str = "From the ashes of complexity, rises simplicity";

pub const APP_PHILOSOPHY: &str = "Shinku is not just a text editor; it's a mini-adventure in code. \
Born from curiosity and fueled by Rust, it turns ordinary typing into a heroic quest. \
Every feature is crafted to delight, every shortcut is a secret path, and every line of code you write \
feels like taming a tiny dragon.";

pub struct AppInfo {
    pub name: &'static str,
    pub version: &'static str,
    pub edition: &'static str,
    pub author: &'static str,
    pub license: &'static str,
    pub description: &'static str,
    pub faq: Vec<(&'static str, &'static str)>,
}

impl AppInfo {
    pub fn new() -> Self {
        Self {
            name: APP_NAME,
            version: APP_VERSION,
            edition: APP_EDITION,
            author: AUTHOR,
            license: LICENSE,
            description: APP_DESCRIPTION,
            faq: vec![
                ("Q: Why is it called Shinku?", 
                 "A: Because every line of code you write feels like a tiny, fiery adventure — think Phoenix reborn! 🔥"),
                
                ("Q: What makes Shinku special?", 
                 "A: Lightning-fast Rust core + Tauri + CodeMirror 6 wizardry. Your code writes itself… almost. ⚡"),
                
                ("Q: Can I use it for multiple languages?", 
                 "A: Absolutely! JavaScript, Python, Rust, and more. Shinku speaks them all. 🗣️"),
                
                ("Q: Is it fast?", 
                 "A: Blink and you'll miss it. Optimized like a rocket — the only lag is your coffee brewing. 🚀"),
                
                ("Q: Does it have dark mode?", 
                 "A: Yes! Because coding at night shouldn’t fry your eyes. 🌙"),
                
                ("Q: Are there keyboard shortcuts?", 
                 "A: Of course! Hit the keys, bend the editor to your will. ⌨️"),
                
                ("Q: Can I experiment freely?", 
                 "A: Totally. Break it, fix it, learn Rust, have fun — repeat. 🧪"),
                
                ("Q: Is it beginner-friendly?", 
                 "A: Even if you're new to Rust, Shinku makes coding feel like a game. 🎮"),
                
                ("Q: What’s next for Shinku?", 
                 "A: UI polish, settings, and maybe a dragon or two. Phase 3 incoming! 🐉"),
            ],
        }
    }

    pub fn full_info(&self) -> String {
        format!(
            "{} v{} ({})\nAuthor: {}\nLicense: {}\n\n{}\n\n{}",
            self.name,
            self.version,
            self.edition,
            self.author,
            self.license,
            self.description,
            APP_PHILOSOPHY
        )
    }

    pub fn faq_text(&self) -> String {
        self.faq
            .iter()
            .map(|(q, a)| format!("{}\n{}", q, a))
            .collect::<Vec<String>>()
            .join("\n\n")
    }
}

impl Default for AppInfo {
    fn default() -> Self {
        Self::new()
    }
}

/// Build information
pub const BUILD_DATE: &str = "2026-01-19";
pub const BUILD_TARGET: &str = "windows";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_info_creation() {
        let info = AppInfo::new();
        assert_eq!(info.name, "Shinku");
        assert_eq!(info.version, "0.1.0");
        assert!(!info.faq.is_empty());
    }
}
