import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SaveIcon,
  CheckCheckIcon,
  RotateCcwIcon,
  AlertTriangleIcon,
  SparklesIcon,
} from './Icons.js';

interface HeaderProps {
  fileName: string;
  totalConflicts: number;
  unresolvedCount: number;
  activeConflictIndex: number;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onResolveAllCurrent: () => void;
  onResolveAllIncoming: () => void;
  onResetAll: () => void;
  onSave: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  fileName,
  totalConflicts,
  unresolvedCount,
  activeConflictIndex,
  onNavigatePrev,
  onNavigateNext,
  onResolveAllCurrent,
  onResolveAllIncoming,
  onResetAll,
  onSave,
}) => {
  const allResolved = unresolvedCount === 0;

  return (
    <header className="header-bar">
      <div className="header-left">
        <div className="header-title-group">
          <span className="header-title">Simple Merge</span>
          {fileName && <span className="file-badge" title={fileName}>{fileName}</span>}
        </div>

        <div className={`conflict-badge ${allResolved ? 'all-resolved' : 'has-unresolved'}`}>
          {allResolved ? (
            <>
              <CheckCheckIcon className="w-3.5 h-3.5" />
              <span>All {totalConflicts} Resolved</span>
            </>
          ) : (
            <>
              <AlertTriangleIcon className="w-3.5 h-3.5" />
              <span>
                {unresolvedCount} of {totalConflicts} Unresolved
              </span>
            </>
          )}
        </div>
      </div>

      <div className="header-center">
        {totalConflicts > 0 && (
          <div className="nav-button-group">
            <button
              className="nav-btn"
              onClick={onNavigatePrev}
              title="Previous Conflict (Alt+[)"
              aria-label="Previous Conflict"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span style={{ padding: '0 8px', fontSize: '11px', color: 'var(--fg-muted)' }}>
              Conflict {activeConflictIndex + 1} of {totalConflicts}
            </span>
            <button
              className="nav-btn"
              onClick={onNavigateNext}
              title="Next Conflict (Alt+])"
              aria-label="Next Conflict"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          className="btn btn-outline btn-sm"
          onClick={onResolveAllCurrent}
          title="Accept all Current changes (Ours)"
        >
          Take All Current
        </button>

        <button
          className="btn btn-outline btn-sm"
          onClick={onResolveAllIncoming}
          title="Accept all Incoming changes (Theirs)"
        >
          Take All Incoming
        </button>

        <button
          className="btn btn-outline btn-sm"
          onClick={onResetAll}
          title="Reset all conflict selections"
        >
          <RotateCcwIcon className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="header-right">
        <button
          className={`btn ${allResolved ? 'btn-success' : 'btn-primary'}`}
          onClick={onSave}
          title={allResolved ? 'Save resolved file to disk' : 'Save (some conflicts still unresolved)'}
        >
          <SaveIcon className="w-4 h-4" />
          <span>Save &amp; Resolve</span>
        </button>
      </div>
    </header>
  );
};
