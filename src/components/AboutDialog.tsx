import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppInfo {
  name: string;
  version: string;
  edition: string;
  author: string;
  license: string;
  description: string;
  philosophy: string;
  repository: string;
  faq: [string, string][];
}

const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose }) => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    if (isOpen && !appInfo) {
      invoke<AppInfo>("get_app_info")
        .then(setAppInfo)
        .catch(console.error);
    }
  }, [isOpen, appInfo]);

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

  if (!isOpen || !appInfo) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>About {appInfo.name}</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="about-section">
            <h3>{appInfo.name}</h3>
            <p className="about-tagline">{appInfo.description}</p>
            
            <div className="about-info">
              <p><strong>Version:</strong> {appInfo.version} ({appInfo.edition})</p>
              <p><strong>Author:</strong> {appInfo.author}</p>
              <p><strong>License:</strong> {appInfo.license}</p>
              <p><strong>Repository:</strong> <a href={appInfo.repository} target="_blank" rel="noopener noreferrer">GitHub</a></p>
            </div>

            <div className="about-description">
              <p>{appInfo.philosophy}</p>
            </div>

            <div className="about-technical">
              <h4>Technical Capabilities:</h4>
              <div className="tech-grid">
                <div className="tech-item">
                  <span className="tech-icon">📝</span>
                  <div>
                    <strong>Rope Buffer</strong>
                    <p>Efficient text editing with ropey data structure for large files</p>
                  </div>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">↩️</span>
                  <div>
                    <strong>Undo/Redo System</strong>
                    <p>Full command history with unlimited undo and redo operations</p>
                  </div>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">🌳</span>
                  <div>
                    <strong>File Tree Sidebar</strong>
                    <p>Intuitive file navigation with VS Code-style interface</p>
                  </div>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">⚡</span>
                  <div>
                    <strong>Rust Backend</strong>
                    <p>Blazing fast performance powered by Tauri and Rust</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-faq">
              <h4>Frequently Asked Questions:</h4>
              {appInfo.faq.map(([question, answer], index) => (
                <div key={index} className="faq-item">
                  <p className="faq-question">{question}</p>
                  <p className="faq-answer">{answer}</p>
                </div>
              ))}
            </div>

            <p className="about-footer">Built with ❤️ by {appInfo.author}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutDialog;
