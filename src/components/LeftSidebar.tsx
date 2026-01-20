import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import DropdownMenu from './DropdownMenu';
import AboutDialog from './AboutDialog';
import ShortcutsDialog from './ShortcutsDialog';
import '../styles/sidebar.css';

interface LeftSidebarProps {
  onNewFile: () => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onSaveFileAs: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFindReplace: () => void;
  fileName: string;
}

export default function LeftSidebar({
  onNewFile,
  onOpenFile,
  onSaveFile,
  onSaveFileAs,
  onUndo,
  onRedo,
  onFindReplace,
}: LeftSidebarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleOpenFolder = async () => {
    try {
      await invoke('open_folder');
      setActiveDropdown(null);
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const handleNewFolder = () => {
    console.log('New Folder - Not implemented yet');
    setActiveDropdown(null);
  };

  const handleCloseFile = () => {
    console.log('Close File - Not implemented yet');
    setActiveDropdown(null);
  };

  const handleSaveAll = () => {
    console.log('Save All - Not implemented yet');
    setActiveDropdown(null);
  };

  const handleCut = () => {
    document.execCommand('cut');
    setActiveDropdown(null);
  };

  const handleCopy = () => {
    document.execCommand('copy');
    setActiveDropdown(null);
  };

  const handlePaste = () => {
    document.execCommand('paste');
    setActiveDropdown(null);
  };

  const handleFindReplace = () => {
    onFindReplace();
    setActiveDropdown(null);
  };

  const filesMenuItems = [
    { label: 'Open File', action: () => { onOpenFile(); setActiveDropdown(null); }, shortcut: 'Ctrl+O' },
    { label: 'Open Folder', action: handleOpenFolder, shortcut: 'Ctrl+K Ctrl+O' },
    { label: 'New File', action: () => { onNewFile(); setActiveDropdown(null); }, separator: true, shortcut: 'Ctrl+N' },
    { label: 'New Folder', action: handleNewFolder, shortcut: 'Ctrl+Shift+N' },
    { label: 'Close', action: handleCloseFile, separator: true, shortcut: 'Ctrl+W' },
    { label: 'Save', action: () => { onSaveFile(); setActiveDropdown(null); }, shortcut: 'Ctrl+S' },
    { label: 'Save As', action: () => { onSaveFileAs(); setActiveDropdown(null); }, shortcut: 'Ctrl+Shift+S' },
    { label: 'Save All', action: handleSaveAll, shortcut: 'Ctrl+K S' },
  ];

  const editMenuItems = [
    { label: 'Undo', action: () => { onUndo(); setActiveDropdown(null); }, shortcut: 'Ctrl+Z' },
    { label: 'Redo', action: () => { onRedo(); setActiveDropdown(null); }, separator: true, shortcut: 'Ctrl+Y' },
    { label: 'Cut', action: handleCut, shortcut: 'Ctrl+X' },
    { label: 'Copy', action: handleCopy, shortcut: 'Ctrl+C' },
    { label: 'Paste', action: handlePaste, separator: true, shortcut: 'Ctrl+V' },
    { label: 'Find Replace', action: handleFindReplace, shortcut: 'Ctrl+H' },
  ];

  const aboutMenuItems = [
    { label: 'About Shinku 神紅', action: () => { setShowAbout(true); setActiveDropdown(null); } },
    { label: 'Keyboard Shortcuts', action: () => { setShowShortcuts(true); setActiveDropdown(null); } },
  ];

  return (
    <>
      <div className="left-sidebar">
        {/* Files Button */}
        <div className="sidebar-button-group">
          <button
            className={`sidebar-btn ${activeDropdown === 'files' ? 'active' : ''}`}
            onClick={() => setActiveDropdown(activeDropdown === 'files' ? null : 'files')}
            title="Files"
          >
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
          </button>
          {activeDropdown === 'files' && (
            <DropdownMenu
              items={filesMenuItems}
              position="right"
              onClose={() => setActiveDropdown(null)}
            />
          )}
        </div>

        {/* Edit Button */}
        <div className="sidebar-button-group">
          <button
            className={`sidebar-btn ${activeDropdown === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveDropdown(activeDropdown === 'edit' ? null : 'edit')}
            title="Edit"
          >
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          {activeDropdown === 'edit' && (
            <DropdownMenu
              items={editMenuItems}
              position="right"
              onClose={() => setActiveDropdown(null)}
            />
          )}
        </div>

        {/* About Button */}
        <div className="sidebar-button-group">
          <button
            className={`sidebar-btn ${activeDropdown === 'about' ? 'active' : ''}`}
            onClick={() => setActiveDropdown(activeDropdown === 'about' ? null : 'about')}
            title="About"
          >
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
          </button>
          {activeDropdown === 'about' && (
            <DropdownMenu
              items={aboutMenuItems}
              position="right"
              onClose={() => setActiveDropdown(null)}
            />
          )}
        </div>
      </div>

      <AboutDialog isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <ShortcutsDialog isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}
