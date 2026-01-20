import React from "react";

interface FileHeaderProps {
  title: string;
  isModified: boolean;
}

const FileHeader: React.FC<FileHeaderProps> = ({ title, isModified }) => {
  return (
    <div className="file-header">
      <span className="file-title">{title}</span>
      {isModified && <div className="modified-indicator" />}
    </div>
  );
};

export default FileHeader;
