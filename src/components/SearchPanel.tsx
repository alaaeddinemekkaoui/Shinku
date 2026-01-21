import React, { useState, useCallback } from "react";
import "../styles/search.css";

interface SearchResult {
  path: string;
  type: "file" | "folder";
  matches: number; // number of matches found in file
}

interface SearchPanelProps {
  isOpen: boolean;
  results?: SearchResult[];
  onSearch?: (query: string) => void;
  onResultClick?: (result: SearchResult) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  isOpen,
  results = [],
  onSearch,
  onResultClick,
}) => {
  const [query, setQuery] = useState("");

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      if (onSearch) {
        onSearch(value);
      }
    },
    [onSearch]
  );

  return (
    <div className={`search-panel ${isOpen ? "open" : "closed"}`}>
      <div className="search-header">
        <input
          type="text"
          className="search-input"
          placeholder="Search files and folders..."
          value={query}
          onChange={handleSearch}
          autoFocus
        />
      </div>
      {isOpen && (
        <div className="search-results">
          {query.length > 0 && (
            <>
              {results.length === 0 ? (
                <div className="search-empty">No results found</div>
              ) : (
                results.map((result, idx) => (
                  <div
                    key={idx}
                    className="search-result-item"
                    onClick={() => onResultClick?.(result)}
                  >
                    <span className="result-icon">
                      {result.type === "folder" ? "📁" : "📄"}
                    </span>
                    <span className="result-path">{result.path}</span>
                    {result.matches > 0 && (
                      <span className="result-matches">({result.matches})</span>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
