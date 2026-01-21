import React, { useState, useEffect } from "react";
import "../styles/header.css";

export interface UnsavedFileItem {
  id: string;
  name: string;
}

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  files: UnsavedFileItem[];
  onSaveSelected: (ids: string[]) => Promise<void> | void;
  onDontSave: () => void;
  onCancel: () => void;
}

const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  files,
  onSaveSelected,
  onDontSave,
  onCancel,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      // Default select all unsaved files
      setSelected(new Set(files.map(f => f.id)));
    }
  }, [isOpen, files]);

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    await onSaveSelected(Array.from(selected));
  };

  return (
    <div className="preferences-overlay">
      <div className="preferences-dialog" style={{ maxWidth: 520 }}>
        <div className="preferences-header">
          <h2>Save changes?</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        <div className="preferences-content" style={{ paddingTop: 8 }}>
          <p>The following files have unsaved changes. Choose which to save before closing.</p>
          <div style={{
            maxHeight: 180,
            overflowY: "auto",
            border: "1px solid #3e3e42",
            borderRadius: 4,
          }}>
            {files.map(file => (
              <label key={file.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderBottom: "1px solid #3e3e42",
              }}>
                <input
                  type="checkbox"
                  checked={selected.has(file.id)}
                  onChange={() => toggle(file.id)}
                />
                <span style={{ color: "#cccccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
              </label>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <button className="menu-dropdown-item" onClick={handleSave} style={{ width: "auto" }}>Save Selected</button>
            <button className="menu-dropdown-item" onClick={onDontSave} style={{ width: "auto" }}>Don't Save</button>
            <button className="menu-dropdown-item" onClick={onCancel} style={{ width: "auto" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesDialog;
