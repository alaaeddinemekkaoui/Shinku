import React, { useState, useEffect, useRef } from "react";

type Theme = "dark" | "light" | "golden";

const ThemeSelector: React.FC = () => {
  const [theme, setTheme] = useState<Theme>("dark");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const applyTheme = (newTheme: Theme) => {
    if (newTheme === "dark") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    setIsOpen(false);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return "☀️";
      case "golden":
        return "✨";
      default:
        return "🌙";
    }
  };

  const getThemeName = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "golden":
        return "Golden";
      default:
        return "Dark";
    }
  };

  return (
    <div className="theme-selector" ref={dropdownRef}>
      <button
        className="theme-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Theme"
      >
        <span className="theme-icon">{getThemeIcon()}</span>
        <span>{getThemeName()}</span>
      </button>

      {isOpen && (
        <div className="theme-dropdown">
          <div
            className={`theme-option ${theme === "dark" ? "active" : ""}`}
            onClick={() => handleThemeChange("dark")}
          >
            <span className="theme-color-preview" style={{ background: "#000000" }}></span>
            <span>🌙 Dark Mode</span>
          </div>
          <div
            className={`theme-option ${theme === "light" ? "active" : ""}`}
            onClick={() => handleThemeChange("light")}
          >
            <span className="theme-color-preview" style={{ background: "#F7F7F7", border: "1px solid #d0d0d0" }}></span>
            <span>☀️ Light Mode</span>
          </div>
          <div
            className={`theme-option ${theme === "golden" ? "active" : ""}`}
            onClick={() => handleThemeChange("golden")}
          >
            <span className="theme-color-preview" style={{ background: "linear-gradient(135deg, #854836, #FFB22C)" }}></span>
            <span>✨ Golden Brown</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
