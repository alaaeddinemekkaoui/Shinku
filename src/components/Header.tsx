import React, { useState, useEffect } from "react";
import "../styles/header.css";

interface HeaderProps {
  onAbout?: () => void;
  onSettings?: () => void;
  onTerminal?: () => void;
  onShortcuts?: () => void;
  onNew?: () => void;
  onOpen?: () => void;
  onOpenFolder?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onClose?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFind?: () => void;
  onReplace?: () => void;
  onSelectAll?: () => void;
  onGoToLine?: () => void;
  onFormatDocument?: () => void;
}

interface HeaderConfig {
  logo: string;
  appName: string;
  version: string;
  githubRepo: string;
}

const Header: React.FC<HeaderProps> = ({
  onAbout,
  onSettings,
  onTerminal,
  onShortcuts,
  onNew,
  onOpen,
  onOpenFolder,
  onCopy,
  onCut,
  onPaste,
  onSave,
  onSaveAs,
  onClose,
  onUndo,
  onRedo,
  onFind,
  onReplace,
  onSelectAll,
  onGoToLine,
  onFormatDocument,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    logo: "/icons/shinku.png",
    appName: "Shinku",
    version: "0.1.0",
    githubRepo: "https://github.com/alaaeddinemekkaoui/Shinku",
  });

  useEffect(() => {
    // Load header config from app_info.json
    fetch("/config/app_info.json")
      .then((res) => res.json())
      .then((data) => {
        if (data.header) {
          setHeaderConfig(data.header);
        }
      })
      .catch((err) => console.error("Failed to load header config:", err));
  }, []);

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
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onNew)}>
                New File
                <span className="menu-shortcut">Ctrl+N</span>
              </button>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onOpen)}>
                Open File
                <span className="menu-shortcut">Ctrl+O</span>
              </button>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onOpenFolder)}>
                Open Folder
                <span className="menu-shortcut">Ctrl+Shift+O</span>
              </button>
              <div className="menu-divider"></div>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onSave)}>
                Save
                <span className="menu-shortcut">Ctrl+S</span>
              </button>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onSaveAs)}>
                Save As...
                <span className="menu-shortcut">Ctrl+Shift+S</span>
              </button>
              <div className="menu-divider"></div>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onClose)}>
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
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onUndo)}>
                Undo
                <span className="menu-shortcut">Ctrl+Z</span>
              </button>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onRedo)}>
                Redo
                <span className="menu-shortcut">Ctrl+Y</span>
              </button>
              <div className="menu-divider"></div>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onCopy)}>
                Copy
                <span className="menu-shortcut">Ctrl+C</span>
              </button>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onCut)}>
                Cut
                <span className="menu-shortcut">Ctrl+X</span>
              </button>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onPaste)}>
                Paste
                <span className="menu-shortcut">Ctrl+V</span>
              </button>
              <div className="menu-divider"></div>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onFind)}>
                Find
                <span className="menu-shortcut">Ctrl+F</span>
              </button>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onReplace)}>
                Replace
                <span className="menu-shortcut">Ctrl+H</span>
              </button>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onGoToLine)}>
                Go to Line
                <span className="menu-shortcut">Ctrl+G</span>
              </button>
              <div className="menu-divider"></div>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onSelectAll)}>
                Select All
                <span className="menu-shortcut">Ctrl+A</span>
              </button>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onFormatDocument)}>
                Format Document
                <span className="menu-shortcut">Shift+Alt+F</span>
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
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onTerminal)}>
                Terminal
                <span className="menu-shortcut">Ctrl+`</span>
              </button>
              <div className="menu-divider"></div>
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onShortcuts)}>
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
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onSettings)}>
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
              <button className="menu-dropdown-item" onMouseDown={() => handleMenuItemClick(onAbout)}>
                About
              </button>
              <button
                className="menu-dropdown-item"
                onMouseDown={() => {
                  window.open(headerConfig.githubRepo, "_blank");
                  closeMenus();
                }}
              >
                GitHub Repository
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="header-center">
        <div className="app-branding">
          <img src={headerConfig.logo} alt="Logo" className="app-logo" />
          <span className="app-name">{headerConfig.appName}</span>
        </div>
      </div>

      <div className="header-right">
        <span className="app-version">{headerConfig.version}</span>
        <a
          href={headerConfig.githubRepo}
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          title="GitHub Repository"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default Header;
