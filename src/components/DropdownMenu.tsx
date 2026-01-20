import React, { useState, useRef, useEffect } from "react";

interface MenuItem {
  label: string;
  action: () => void;
  shortcut?: string;
  separator?: boolean;
}

interface DropdownMenuProps {
  label?: string;
  items: MenuItem[];
  position?: 'bottom' | 'right';
  onClose?: () => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, items, position = 'bottom', onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className={`dropdown dropdown-${position}`} ref={dropdownRef}>
      {label && (
        <button
          className="dropdown-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          {label} ▼
        </button>
      )}
      {isOpen && (
        <div className="dropdown-menu">
          {items.map((item, index) => (
            item.separator ? (
              <div key={index} className="dropdown-separator" />
            ) : (
              <button
                key={index}
                className="dropdown-item"
                onClick={() => handleItemClick(item.action)}
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="shortcut-hint">{item.shortcut}</span>
                )}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
