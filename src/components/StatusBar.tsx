import React from "react";

interface StatusBarProps {
  line: number;
  column: number;
  lineCount: number;
  isModified: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({
  line,
  column,
  lineCount,
  isModified,
}) => {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">
          <strong>Shinku Editor</strong>
        </span>
      </div>
      <div className="status-right">
        <span className="status-item">
          <strong>Ln {line}</strong> | <strong>Col {column}</strong>
        </span>
        <span className="status-item">{lineCount} lines</span>
        <span className="status-item">
          <div
            className={`status-indicator ${isModified ? "modified" : "saved"}`}
          />
          {isModified ? "Modified" : "Saved"}
        </span>
      </div>
    </div>
  );
};

export default StatusBar;
