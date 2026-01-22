import React, { useState, useEffect } from "react";
import "../styles/welcome.css";

interface RecentItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'workspace';
  path: string;
  lastOpened: number;
}

interface WelcomeConfig {
  japaneseText: string;
  englishTitle: string;
  description: string;
  logo: string;
}

interface ActionCard {
  icon: string;
  title: string;
  description: string;
  shortcut?: string;
  onClick: () => void;
}

interface WelcomePageProps {
  onOpenFile?: () => void;
  onOpenFolder?: () => void;
  onOpenRecent?: (path: string) => void;
  onCreateFolderWorkspace?: () => void;
  onCreateFilesWorkspace?: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({
  onOpenFile,
  onOpenFolder,
  onOpenRecent,
  onCreateFolderWorkspace,
  onCreateFilesWorkspace,
}) => {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [welcomeConfig, setWelcomeConfig] = useState<WelcomeConfig | null>(null);

  useEffect(() => {
    // Load welcome config from app_info.json
    const loadConfig = async () => {
      try {
        const response = await fetch('/config/app_info.json');
        const data = await response.json();
        if (data.welcome) {
          setWelcomeConfig(data.welcome);
        }
      } catch (error) {
        console.error('Failed to load welcome config:', error);
      }
    };

    loadConfig();

    // Load recent items from localStorage
    const stored = localStorage.getItem('shinku-recent-items');
    if (stored) {
      try {
        const items = JSON.parse(stored) as RecentItem[];
        // Sort by last opened, most recent first
        items.sort((a, b) => b.lastOpened - a.lastOpened);
        setRecentItems(items.slice(0, 10)); // Show last 10
      } catch (error) {
        console.error('Failed to load recent items:', error);
      }
    }
  }, []);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'folder':
        return <span className="material-symbols-outlined">folder_open</span>;
      case 'workspace':
        return <span className="material-symbols-outlined">workspaces</span>;
      default:
        return <span className="material-symbols-outlined">description</span>;
    }
  };

  const actionCards: ActionCard[] = [
    {
      icon: 'description',
      title: 'Open File',
      description: 'Quick access to your files',
      shortcut: 'Ctrl+O',
      onClick: () => onOpenFile?.()
    },
    {
      icon: 'folder_open',
      title: 'Open Folder',
      description: 'Browse and edit projects',
      shortcut: 'Ctrl+Shift+O',
      onClick: () => onOpenFolder?.()
    },
    {
      icon: 'create_new_folder',
      title: 'Folder Workspace',
      description: 'Create organized workspace',
      onClick: () => onCreateFolderWorkspace?.()
    },
    {
      icon: 'library_books',
      title: 'Files Workspace',
      description: 'Work with multiple files',
      onClick: () => onCreateFilesWorkspace?.()
    }
  ];

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <div className="welcome-header">
          <div className="welcome-branding">
            {welcomeConfig?.logo && (
              <div className="welcome-logo-container">
                <img src={welcomeConfig.logo} alt="Shinku Logo" className="welcome-logo" />
              </div>
            )}
            <div className="welcome-title-section">
              <div className="welcome-japanese">{welcomeConfig?.japaneseText || "神紅"}</div>
              <h1 className="welcome-title">{welcomeConfig?.englishTitle || "Shinku"}</h1>
              <p className="welcome-subtitle">{welcomeConfig?.description || "A simple, powerful text editor"}</p>
            </div>
          </div>
        </div>

        <div className="welcome-actions-grid">
          {actionCards.map((card, index) => (
            <button 
              key={index}
              className="action-card" 
              onClick={card.onClick}
            >
              <span className="action-card-icon material-symbols-outlined">{card.icon}</span>
              <div className="action-card-content">
                <h3 className="action-card-title">{card.title}</h3>
                <p className="action-card-description">{card.description}</p>
                {card.shortcut && (
                  <span className="action-card-shortcut">{card.shortcut}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {recentItems.length > 0 && (
          <div className="welcome-recent">
            <h2>Recent Files & Folders</h2>
            <div className="recent-list">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="recent-item"
                  onClick={() => onOpenRecent?.(item.path)}
                  title={item.path}
                >
                  <span className="recent-icon">{getIcon(item.type)}</span>
                  <div className="recent-info">
                    <div className="recent-name">{item.name}</div>
                    <div className="recent-time">{formatDate(item.lastOpened)}</div>
                  </div>
                  <span className="recent-path">{item.type === 'folder' ? 'Folder' : 'File'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="welcome-tips">
          <h3>Tips</h3>
          <ul>
            <li>Folder Workspace: Full file & folder management in one location</li>
            <li>Files Workspace: Combine files from different directories</li>
            <li>Recent items are saved automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
