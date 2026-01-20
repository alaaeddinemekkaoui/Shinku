import React, { useEffect } from "react";
import shortcutsData from "../../config/shortcuts.json";

interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⌨️ Keyboard Shortcuts</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="shortcuts-grid">
            <div className="shortcuts-section">
              <h3>File Operations</h3>
              <div className="shortcuts-list">
                {shortcutsData.file.map((item, index) => (
                  <div key={index} className="shortcut-item">
                    <span className="shortcut-action">{item.action}</span>
                    <kbd className="shortcut-key">{item.shortcut}</kbd>
                  </div>
                ))}
              </div>
            </div>

            <div className="shortcuts-section">
              <h3>Edit Operations</h3>
              <div className="shortcuts-list">
                {shortcutsData.edit.map((item, index) => (
                  <div key={index} className="shortcut-item">
                    <span className="shortcut-action">{item.action}</span>
                    <kbd className="shortcut-key">{item.shortcut}</kbd>
                  </div>
                ))}
              </div>
            </div>

            <div className="shortcuts-section">
              <h3>View Operations</h3>
              <div className="shortcuts-list">
                {shortcutsData.view.map((item, index) => (
                  <div key={index} className="shortcut-item">
                    <span className="shortcut-action">{item.action}</span>
                    <kbd className="shortcut-key">{item.shortcut}</kbd>
                  </div>
                ))}
              </div>
            </div>

            <div className="shortcuts-section">
              <h3>General</h3>
              <div className="shortcuts-list">
                {shortcutsData.general.map((item, index) => (
                  <div key={index} className="shortcut-item">
                    <span className="shortcut-action">{item.action}</span>
                    <kbd className="shortcut-key">{item.shortcut}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsDialog;
