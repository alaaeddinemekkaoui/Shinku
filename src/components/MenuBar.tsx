import React from "react";
import ThemeSelector from "./ThemeSelector";

interface MenuBarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({ onNew, onOpen, onSave, onSaveAs }) => {
  return (
    <div className="menu-bar">
      <div className="menu-section">
        <button className="menu-button" onClick={onNew}>
          New
        </button>
        <button className="menu-button" onClick={onOpen}>
          Open
        </button>
        <button className="menu-button" onClick={onSave}>
          Save
        </button>
        <button className="menu-button" onClick={onSaveAs}>
          Save As
        </button>
      </div>
      <div className="menu-section">
        <button className="menu-button" title="Undo">
          Undo
        </button>
        <button className="menu-button" title="Redo">
          Redo
        </button>
      </div>
      <div className="menu-section">
        <button className="menu-button" title="Find">
          Find
        </button>
        <button className="menu-button" title="Replace">
          Replace
        </button>
      </div>
      <div className="menu-section" style={{ marginLeft: "auto" }}>
        <ThemeSelector />
      </div>
    </div>
  );
};

export default MenuBar;
