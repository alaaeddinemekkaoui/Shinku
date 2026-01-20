import React, { useState } from 'react';
import '../styles/findreplace.css';

interface FindReplaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const FindReplace: React.FC<FindReplaceProps> = ({ isOpen, onClose }) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  if (!isOpen) return null;

  const handleFindNext = () => {
    console.log('Find next:', findText);
    // TODO: Implement find functionality
  };

  const handleFindPrevious = () => {
    console.log('Find previous:', findText);
    // TODO: Implement find functionality
  };

  const handleFindAll = () => {
    console.log('Find all:', findText);
    // TODO: Implement find all functionality
  };

  const handleReplace = () => {
    console.log('Replace:', replaceText);
    // TODO: Implement replace functionality
  };

  const handleReplaceAll = () => {
    console.log('Replace all:', replaceText);
    // TODO: Implement replace all functionality
  };

  return (
    <div className="find-replace-overlay" onClick={onClose}>
      <div className="find-replace-container" onClick={(e) => e.stopPropagation()}>
        <div className="find-replace-header">
          <h3>Find & Replace</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="find-replace-body">
          {/* Find Section */}
          <div className="search-row">
            <label>Find</label>
            <div className="input-group">
              <input
                type="text"
                className="search-input"
                placeholder="Find"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                autoFocus
              />
              <div className="action-buttons">
                <button 
                  className="action-btn" 
                  onClick={handleFindPrevious}
                  title="Previous (Shift+Enter)"
                >
                  ↑
                </button>
                <button 
                  className="action-btn" 
                  onClick={handleFindNext}
                  title="Next (Enter)"
                >
                  ↓
                </button>
                <button 
                  className="action-btn primary" 
                  onClick={handleFindAll}
                  title="Find All"
                >
                  All
                </button>
              </div>
            </div>
          </div>

          {/* Replace Section */}
          <div className="search-row">
            <label>Replace</label>
            <div className="input-group">
              <input
                type="text"
                className="search-input"
                placeholder="Replace"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
              />
              <div className="action-buttons">
                <button 
                  className="action-btn primary" 
                  onClick={handleReplace}
                  title="Replace (Ctrl+Shift+1)"
                >
                  Replace
                </button>
                <button 
                  className="action-btn primary" 
                  onClick={handleReplaceAll}
                  title="Replace All (Ctrl+Shift+Enter)"
                >
                  Replace All
                </button>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="options-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
              />
              <span>Match Case</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
              />
              <span>Whole Word</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
              />
              <span>Use Regex</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindReplace;
