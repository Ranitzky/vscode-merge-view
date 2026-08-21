import React, { useState } from 'react';
import { EyeIcon, Edit3Icon, CheckIcon, LayersIcon } from './Icons.js';

interface ResultEditorProps {
  assembledText: string;
  unresolvedCount: number;
  totalConflicts: number;
  isDirectEditMode: boolean;
  onToggleDirectEditMode: (enabled: boolean) => void;
  onDirectEditChange: (text: string) => void;
}

export const ResultEditor: React.FC<ResultEditorProps> = ({
  assembledText,
  unresolvedCount,
  totalConflicts,
  isDirectEditMode,
  onToggleDirectEditMode,
  onDirectEditChange,
}) => {
  const [copied, setCopied] = useState(false);
  const lines = assembledText.split(/\r?\n/);
  const allResolved = unresolvedCount === 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(assembledText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bottom-result-container">
      <div className="result-header">
        <div className="result-title-group">
          <span className="result-title">
            <LayersIcon className="w-4 h-4" />
            Result Output ({lines.length} lines)
          </span>

          <span
            className={`result-status-tag ${
              allResolved ? 'all-resolved' : 'has-unresolved'
            }`}
          >
            {allResolved
              ? '✓ All conflicts resolved'
              : `⚠️ ${unresolvedCount} unresolved conflict${unresolvedCount === 1 ? '' : 's'}`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleCopy}
            title="Copy merged output to clipboard"
          >
            {copied ? <CheckIcon className="w-3 h-3" /> : null}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <div className="result-mode-tabs">
            <button
              className={`result-tab-btn ${!isDirectEditMode ? 'active' : ''}`}
              onClick={() => onToggleDirectEditMode(false)}
              title="Live interactive output synced with checkboxes"
            >
              <EyeIcon className="w-3 h-3" />
              Live Preview
            </button>

            <button
              className={`result-tab-btn ${isDirectEditMode ? 'active' : ''}`}
              onClick={() => onToggleDirectEditMode(true)}
              title="Direct manual editing"
            >
              <Edit3Icon className="w-3 h-3" />
              Direct Edit
            </button>
          </div>
        </div>
      </div>

      <div className="result-editor-body">
        {isDirectEditMode ? (
          <textarea
            className="result-textarea"
            value={assembledText}
            onChange={(e) => onDirectEditChange(e.target.value)}
            placeholder="Edit merged output manually here..."
            spellCheck={false}
          />
        ) : (
          <div className="result-lines-list">
            {lines.map((line, idx) => (
              <div key={idx} className="result-line-row">
                <div className="result-line-gutter">{idx + 1}</div>
                <div className="result-line-content">{line || ' '}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
