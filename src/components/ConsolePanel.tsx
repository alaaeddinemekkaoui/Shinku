import React from "react";
import "../styles/console.css";

interface ConsolePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  logs?: string[];
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({
  isOpen,
  onToggle,
  logs = [],
}) => {
  return (
    <div className={`console-panel ${isOpen ? "open" : "closed"}`}>
      <div className="console-header">
        <div className="console-title">📋 Console</div>
        <button className="console-toggle-btn" onClick={onToggle} title="Toggle Console">
          {isOpen ? "−" : "+"}
        </button>
      </div>
      {isOpen && (
        <div className="console-body">
          {logs.length === 0 ? (
            <div className="console-empty">No output yet</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="console-line">
                {log}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ConsolePanel;
