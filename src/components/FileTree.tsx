import React, { useState, useRef, useEffect } from "react";
import { fileMetadataCache, FileMetadata } from "../utils/fileMetadataCache";
import "../styles/filetree.css";

export interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: TreeNode[];
  isOpen?: boolean;
}

interface FileTreeProps {
  nodes: TreeNode[];
  folderPath?: string;
  onFileSelect: (node: TreeNode) => void;
  onFolderOpen?: (node: TreeNode) => void;
  onContextMenu?: (node: TreeNode, action: string) => void;
  onCreateFile?: (parentPath: string, fileName: string) => void;
  onCreateFolder?: (parentPath: string, folderName: string) => void;
  activeFilePath?: string;
}

interface ContextMenu {
  x: number;
  y: number;
  node: TreeNode;
}

const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  folderPath,
  onFileSelect,
  onFolderOpen,
  onContextMenu,
  onCreateFile,
  onCreateFolder,
  activeFilePath,
}) => {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [creatingFile, setCreatingFile] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [creatingName, setCreatingName] = useState("");
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Cache metadata when tree is rendered
  useEffect(() => {
    const cacheMetadata = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        const metadata: FileMetadata = {
          path: node.path,
          name: node.name,
          type: node.type,
        };
        fileMetadataCache.set(node.path, metadata);

        if (node.children) {
          cacheMetadata(node.children);
        }
      });
    };

    cacheMetadata(nodes);
  }, [nodes]);

  const toggleFolder = (id: string) => {
    const newOpen = new Set(openFolders);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenFolders(newOpen);
  };

  const handleNodeClick = (node: TreeNode, e: React.MouseEvent) => {
    e.stopPropagation();

    if (node.type === 'folder') {
      toggleFolder(node.id);
      if (onFolderOpen && !openFolders.has(node.id)) {
        onFolderOpen(node);
      }
    } else {
      onFileSelect(node);
    }
  };

  const handleContextMenu = (node: TreeNode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
    });
  };

  const handleContextMenuAction = (action: string) => {
    if (contextMenu && onContextMenu) {
      onContextMenu(contextMenu.node, action);
    }
    setContextMenu(null);
  };

  const handleCreateFile = () => {
    setCreatingFile(true);
    setCreatingName("");
  };

  const handleCreateFolder = () => {
    setCreatingFolder(true);
    setCreatingName("");
  };

  const handleConfirmCreation = async (type: 'file' | 'folder') => {
    if (!creatingName.trim()) return;

    let parentPath = folderPath;
    
    // If no folder path is provided, get it from the backend (from open folder or active file)
    if (!parentPath) {
      try {
        const { invoke } = await import("@tauri-apps/api/tauri");
        const result = await invoke<string | null>('get_creation_folder');
        if (!result) {
          alert('No folder path available. Please open a folder first or create a new file.');
          handleCancelCreation();
          return;
        }
        parentPath = result;
      } catch (error) {
        console.error('Failed to get creation folder:', error);
        alert('Failed to determine where to create the file/folder');
        handleCancelCreation();
        return;
      }
    }

    if (type === 'file') {
      onCreateFile?.(parentPath, creatingName);
    } else {
      onCreateFolder?.(parentPath, creatingName);
    }
    setCreatingFile(false);
    setCreatingFolder(false);
    setCreatingName("");
  };

  const handleCancelCreation = () => {
    setCreatingFile(false);
    setCreatingFolder(false);
    setCreatingName("");
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isOpen = openFolders.has(node.id);
    const isActive = activeFilePath === node.path;

    return (
      <div key={node.id}>
        <div
          className={`tree-item ${isActive ? 'active' : ''}`}
          style={{ paddingLeft: `${depth * 16}px` }}
          onClick={(e) => handleNodeClick(node, e)}
          onContextMenu={(e) => handleContextMenu(node, e)}
        >
          {node.type === 'folder' ? (
            <>
              <span className="tree-icon">
                {isOpen ? '▼' : '▶'}
              </span>
              <span className="folder-icon">📁</span>
              <span className="tree-label">{node.name}</span>
            </>
          ) : (
            <>
              <span className="tree-icon invisible">▶</span>
              <span className="file-icon">📄</span>
              <span className="tree-label">{node.name}</span>
            </>
          )}
        </div>
        {node.type === 'folder' && isOpen && node.children && (
          <div className="tree-children">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getFolderName = () => {
    if (!folderPath) return 'No Folder';
    const parts = folderPath.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1] || folderPath;
  };

  return (
    <div className="file-tree-container">
      <div className="file-tree-header">
        <span className="file-tree-folder-name" title={folderPath}>
          📁 {getFolderName()}
        </span>
        <div className="file-tree-actions">
          <button 
            className="file-tree-action-btn" 
            title="New File"
            onClick={handleCreateFile}
          >
            +📄
          </button>
          <button 
            className="file-tree-action-btn" 
            title="New Folder"
            onClick={handleCreateFolder}
          >
            +📁
          </button>
        </div>
      </div>
      {(creatingFile || creatingFolder) && (
        <div className="file-tree-create-input">
          <input
            autoFocus
            type="text"
            placeholder={creatingFile ? "file.ext" : "folder-name"}
            value={creatingName}
            onChange={(e) => setCreatingName(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                await handleConfirmCreation(creatingFile ? 'file' : 'folder');
              } else if (e.key === 'Escape') {
                handleCancelCreation();
              }
            }}
            onBlur={handleCancelCreation}
          />
        </div>
      )}
      <div className="file-tree">
        {nodes.length > 0 ? (
          nodes.map((node) => renderNode(node))
        ) : (
          <div className="tree-empty">No folder opened</div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{
            position: "fixed",
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          <div className="context-menu-item" onClick={() => handleContextMenuAction('open')}>
            Open
          </div>
          <div className="context-menu-item" onClick={() => handleContextMenuAction('reveal')}>
            Reveal in Explorer
          </div>
          {contextMenu.node.type === 'file' && (
            <>
              <hr className="context-menu-divider" />
              <div className="context-menu-item" onClick={() => handleContextMenuAction('rename')}>
                Rename
              </div>
              <div className="context-menu-item" onClick={() => handleContextMenuAction('delete')}>
                Delete
              </div>
              <div className="context-menu-item" onClick={() => handleContextMenuAction('copy-path')}>
                Copy Path
              </div>
            </>
          )}
          {contextMenu.node.type === 'folder' && (
            <>
              <hr className="context-menu-divider" />
              <div className="context-menu-item" onClick={() => handleContextMenuAction('new-file')}>
                New File
              </div>
              <div className="context-menu-item" onClick={() => handleContextMenuAction('new-folder')}>
                New Folder
              </div>
              <hr className="context-menu-divider" />
              <div className="context-menu-item" onClick={() => handleContextMenuAction('rename')}>
                Rename
              </div>
              <div className="context-menu-item" onClick={() => handleContextMenuAction('delete')}>
                Delete Folder
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FileTree;
