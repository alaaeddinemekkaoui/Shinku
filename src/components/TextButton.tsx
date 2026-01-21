import React from "react";

interface TextButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}

const TextButton: React.FC<TextButtonProps> = ({ children, onClick, title }) => {
  return (
    <button
      className="text-button"
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
};

export default TextButton;
