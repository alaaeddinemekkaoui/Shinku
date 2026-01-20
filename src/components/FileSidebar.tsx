import React from "react";

export interface FileTab {
  id: string;
  name: string;
  path: string;
  isActive: boolean;
  isDirty?: boolean;
  isSaved?: boolean;
  isModified?: boolean;
}

interface FileSidebarProps {
  files: FileTab[];
  onFileSelect: (fileId: string) => void;
  onFileClose: (fileId: string) => void;
}

const FileSidebar: React.FC<FileSidebarProps> = ({ files, onFileSelect, onFileClose }) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="file-sidebar">
      <div className="file-tabs">
        {files.map((file) => (
          <div
            key={file.id}
            className={`file-tab ${file.isActive ? 'active' : ''}`}
            onClick={() => onFileSelect(file.id)}
          >
            <span className="file-name">
              {file.isModified && <span className="modified-indicator">●</span>}
              {file.name}
            </span>
            <button
              className="close-btn"
              onClick={(e) => {
                e.stopPropagation();
                onFileClose(file.id);
              }}
              title="Close file"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileSidebar;
