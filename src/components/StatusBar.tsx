import React from "react";
import { detectLanguage } from "../utils/languageDetector";

interface StatusBarProps {
  line: number;
  column: number;
  lineCount: number;
  isModified: boolean;
  filePath?: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
  line,
  column,
  lineCount,
  isModified,
  filePath = "Untitled",
}) => {
  const language = detectLanguage(filePath);
  
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">
          <strong>Shinku 神紅 Editor</strong>
        </span>
        {filePath !== "Untitled" && (
          <span className="status-item">
            {language.icon} {language.displayName}
          </span>
        )}
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
