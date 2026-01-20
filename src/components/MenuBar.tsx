import React, { useState } from "react";

interface MenuBarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFindReplace: () => void;
  onAbout: () => void;
  onShortcuts: () => void;
  onOpenFolder: () => void;
  onPreferences: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({ 
  onNew, 
  onOpen, 
  onSave, 
  onSaveAs,
  onUndo,
  onRedo,
  onFindReplace,
  onAbout,
  onShortcuts,
  onOpenFolder,
  onPreferences
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [hoverMenu, setHoverMenu] = useState<string | null>(null);

  const toggleMenu = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleMenuMouseEnter = (menu: string) => {
    setHoverMenu(menu);
    // If a menu is already open, open the hovered menu instead
    if (activeMenu) {
      setActiveMenu(menu);
    }
  };

  const handleMenuMouseLeave = () => {
    setHoverMenu(null);
    // Don't close menu on mouse leave, keep it open until click
  };

  const closeMenus = () => setActiveMenu(null);

  return (
    <div className="vscode-menu-bar">
      {/* Left Section - Menus */}
      <div className="menu-left">

        {/* File Menu */}
        <div className="menu-item-wrapper" onMouseEnter={() => handleMenuMouseEnter('file')} onMouseLeave={handleMenuMouseLeave}>
          <button className="menu-item" onClick={() => toggleMenu('file')}>
            File
          </button>
          {activeMenu === 'file' && (
            <div className="vscode-dropdown">
              <button onClick={() => { onNew(); closeMenus(); }}>
                <span>New File</span>
                <span className="kbd">Ctrl+N</span>
              </button>
              <button onClick={() => { onOpen(); closeMenus(); }}>
                <span>Open File</span>
                <span className="kbd">Ctrl+O</span>
              </button>
              <button onClick={() => { onOpenFolder(); closeMenus(); }}>
                <span>Open Folder</span>
                <span className="kbd">Ctrl+K O</span>
              </button>
              <div className="menu-separator"></div>
              <button onClick={() => { onSave(); closeMenus(); }}>
                <span>Save</span>
                <span className="kbd">Ctrl+S</span>
              </button>
              <button onClick={() => { onSaveAs(); closeMenus(); }}>
                <span>Save As</span>
                <span className="kbd">Ctrl+Shift+S</span>
              </button>
              <div className="menu-separator"></div>
              <button onClick={() => { onPreferences(); closeMenus(); }}>
                <span>Preferences</span>
                <span className="kbd">Ctrl+,</span>
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="menu-item-wrapper" onMouseEnter={() => handleMenuMouseEnter('edit')} onMouseLeave={handleMenuMouseLeave}>
          <button className="menu-item" onClick={() => toggleMenu('edit')}>
            Edit
          </button>
          {activeMenu === 'edit' && (
            <div className="vscode-dropdown">
              <button onClick={() => { onUndo(); closeMenus(); }}>
                <span>Undo</span>
                <span className="kbd">Ctrl+Z</span>
              </button>
              <button onClick={() => { onRedo(); closeMenus(); }}>
                <span>Redo</span>
                <span className="kbd">Ctrl+Y</span>
              </button>
              <div className="menu-separator"></div>
              <button onClick={() => { document.execCommand('cut'); closeMenus(); }}>
                <span>Cut</span>
                <span className="kbd">Ctrl+X</span>
              </button>
              <button onClick={() => { document.execCommand('copy'); closeMenus(); }}>
                <span>Copy</span>
                <span className="kbd">Ctrl+C</span>
              </button>
              <button onClick={() => { document.execCommand('paste'); closeMenus(); }}>
                <span>Paste</span>
                <span className="kbd">Ctrl+V</span>
              </button>
              <div className="menu-separator"></div>
              <button onClick={() => { onFindReplace(); closeMenus(); }}>
                <span>Find</span>
                <span className="kbd">Ctrl+F</span>
              </button>
            </div>
          )}
        </div>

        {/* View Menu */}
        <div className="menu-item-wrapper" onMouseEnter={() => handleMenuMouseEnter('view')} onMouseLeave={handleMenuMouseLeave}>
          <button className="menu-item" onClick={() => toggleMenu('view')}>
            View
          </button>
          {activeMenu === 'view' && (
            <div className="vscode-dropdown">
              <button onClick={() => { console.log('Command Palette'); closeMenus(); }}>
                <span>Command Palette</span>
                <span className="kbd">Ctrl+Shift+P</span>
              </button>
              <button onClick={() => { console.log('Toggle Terminal'); closeMenus(); }}>
                <span>Terminal</span>
                <span className="kbd">Ctrl+`</span>
              </button>
              <div className="menu-separator"></div>
              <button onClick={() => { console.log('Zoom In'); closeMenus(); }}>
                <span>Zoom In</span>
                <span className="kbd">Ctrl++</span>
              </button>
              <button onClick={() => { console.log('Zoom Out'); closeMenus(); }}>
                <span>Zoom Out</span>
                <span className="kbd">Ctrl+-</span>
              </button>
            </div>
          )}
        </div>

        {/* Help Menu */}
        <div className="menu-item-wrapper" onMouseEnter={() => handleMenuMouseEnter('help')} onMouseLeave={handleMenuMouseLeave}>
          <button className="menu-item" onClick={() => toggleMenu('help')}>
            Help
          </button>
          {activeMenu === 'help' && (
            <div className="vscode-dropdown">
              <button onClick={() => { onShortcuts(); closeMenus(); }}>
                <span>Keyboard Shortcuts</span>
                <span className="kbd">Ctrl+K Ctrl+S</span>
              </button>
              <button onClick={() => { onAbout(); closeMenus(); }}>
                <span>About Shinku 神紅</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center - App Title */}
      <div className="menu-center">
        <span className="app-title">Shinku</span>
        <span className="app-title-jp">神紅</span>
      </div>

      {/* Right Section - Empty for now */}
      <div className="menu-right"></div>
    </div>
  );
};

export default MenuBar;
