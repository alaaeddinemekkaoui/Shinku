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
          <h2>ABOUT SHINKU 神紅</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="about-section">
            <div className="about-logo">
              <img src="/icons/shinku.png" alt="Shinku Logo" />
            </div>
            
            <h3>{appInfo.name}</h3>
            <p className="about-version">Version {appInfo.version} - {appInfo.edition}</p>
            
            <div className="about-description">
              <p>{appInfo.philosophy}</p>
            </div>

            <div className="about-faq">
              <h4>FREQUENTLY ASKED QUESTIONS:</h4>
              {appInfo.faq.map(([question, answer], index) => (
                <div key={index} className="faq-item">
                  <p className="faq-question">{question}</p>
                  <p className="faq-answer">{answer}</p>
                </div>
              ))}
            </div>

            <div className="about-footer">
              <p>Built with ❤️ by {appInfo.author}</p>
              <p className="about-license">{appInfo.license} License</p>
              <a href={appInfo.repository} target="_blank" rel="noopener noreferrer">
                View on GitHub →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutDialog;
