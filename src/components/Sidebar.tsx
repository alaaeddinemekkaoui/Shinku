import React from "react";
import "../styles/sidebar.css";

interface SidebarProps {
  onToggleExplorer: () => void;
  onToggleSearch: () => void;
  explorerActive: boolean;
  searchActive: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onToggleExplorer,
  onToggleSearch,
  explorerActive,
  searchActive,
}) => {
  return (
    <div className="sidebar">
      <button
        className={`sidebar-icon-btn ${explorerActive ? "active" : ""}`}
        title="Explorer"
        onClick={onToggleExplorer}
      >
        <span className="material-symbols-outlined">folder</span>
      </button>
      <button
        className={`sidebar-icon-btn ${searchActive ? "active" : ""}`}
        title="Search"
        onClick={onToggleSearch}
      >
        <span className="material-symbols-outlined">search</span>
      </button>
    </div>
  );
};

export default Sidebar;
