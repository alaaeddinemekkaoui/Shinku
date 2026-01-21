import React, { useState } from "react";
import "../styles/header.css";

interface HeaderProps {
  appName?: string;
  appVersion?: string;
  currentFile?: string;
  onAbout?: () => void;
  onSettings?: () => void;
  onTerminal?: () => void;
  onShortcuts?: () => void;
  onNew?: () => void;
  onOpen?: () => void;
  onOpenFolder?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onClose?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onAbout,
  onSettings,
  onTerminal,
  onShortcuts,
  onNew,
  onOpen,
  onOpenFolder,
  onSave,
  onSaveAs,
  onClose,
  onUndo,
  onRedo,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const closeMenus = () => setOpenMenu(null);

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleMenuItemClick = (callback?: () => void) => {
    callback?.();
    closeMenus();
  };

  return (
    <div className="app-header">
      <div className="header-menu-bar">
        <div className="menu-item">
          <button
            className="menu-btn"
            onClick={() => toggleMenu("file")}
            onBlur={closeMenus}
          >
            File
          </button>
          {openMenu === "file" && (
            <div className="menu-dropdown">
              <button className="menu-dropdown-item" onClick={() => handleMenuItemClick(onNew)}>
                New File
                <span className="menu-shortcut">Ctrl+N</span>
              </button>
              <button className="menu-dropdown-item" onClick={() => handleMenuItemClick(onOpen)}>
                Open File
                <span className="menu-shortcut">Ctrl+O</span>
              </button>
              <button className="menu-dropdown-item" onClick={() => handleMenuItemClick(onOpenFolder)}>
                Open Folder
                <span className="menu-shortcut">Ctrl+Shift+O</span>
              </button>
              <div className="menu-divider"></div>
              <button className="menu-dropdown-item" onClick={() => handleMenuItemClick(onSave)}>
                Save
                <span className="menu-shortcut">Ctrl+S</span>
              </button>
              <button className="menu-dropdown-item" onClick={() => handleMenuItemClick(onSaveAs)}>
                Save As...
                <span className="menu-shortcut">Ctrl+Shift+S</span>
              </button>
              <div className="menu-divider"></div>
              <button className="menu-dropdown-item" onClick={() => handleMenuItemClick(onClose)}>
                Close
                <span className="menu-shortcut">Ctrl+W</span>
              </button>
            </div>
          )}
        </div>

        <div className="menu-item">
          <button
            className="menu-btn"
            onClick={() => toggleMenu("edit")}
            onBlur={closeMenus}
          >
            Edit
          </button>
          {openMenu === "edit" && (
            <div className="menu-dropdown">
              <button className="menu-dropdown-item" onClick={() => handleMenuItemClick(onUndo)}>
                Undo
                <span className="menu-shortcut">Ctrl+Z</span>
              </button>
              <button className="menu-dropdown-item" onClick={() => handleMenuItemClick(onRedo)}>
                Redo
                <span className="menu-shortcut">Ctrl+Y</span>
              </button>
            </div>
          )}
        </div>

        <div className="menu-item">
          <button
            className="menu-btn"
            onClick={() => toggleMenu("view")}
            onBlur={closeMenus}
          >
            View
          </button>
          {openMenu === "view" && (
            <div className="menu-dropdown">
              <button className="menu-dropdown-item" onClick={() => handleMenuItemClick(onTerminal)}>
                Terminal
                <span className="menu-shortcut">Ctrl+`</span>
              </button>
              <div className="menu-divider"></div>
              <button className="menu-dropdown-item" onClick={() => handleMenuItemClick(onShortcuts)}>
                All Shortcuts
                <span className="menu-shortcut">Ctrl+K Ctrl+S</span>
              </button>
            </div>
          )}
        </div>

        <div className="menu-item">
          <button
            className="menu-btn"
            onClick={() => toggleMenu("settings")}
            onBlur={closeMenus}
          >
            Settings
          </button>
          {openMenu === "settings" && (
            <div className="menu-dropdown">
              <button className="menu-dropdown-item" onClick={() => handleMenuItemClick(onSettings)}>
                Preferences
                <span className="menu-shortcut">Ctrl+,</span>
              </button>
            </div>
          )}
        </div>

        <div className="menu-item">
          <button
            className="menu-btn"
            onClick={() => toggleMenu("help")}
            onBlur={closeMenus}
          >
            Help
          </button>
          {openMenu === "help" && (
            <div className="menu-dropdown">
              <button className="menu-dropdown-item" onClick={() => handleMenuItemClick(onAbout)}>
                About
              </button>
              <button
                className="menu-dropdown-item"
                onClick={() => {
                  window.open("https://github.com/alaaeddinemekkaoui/Shinku", "_blank");
                  closeMenus();
                }}
              >
                GitHub Repository
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
