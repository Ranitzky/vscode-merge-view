import React from 'react';
import { ConflictChunk, ResolutionType } from '../../types.js';
import { RotateCcwIcon } from './Icons.js';
import { isConflictResolved } from '../../mergeEngine.js';
import { renderTokens } from '../utils/tokenRenderer.js';

interface ConflictBlockViewProps {
  chunk: ConflictChunk;
  isActive: boolean;
  onUpdateConflict: (
    conflictId: string,
    selectedCurrent: number[],
    selectedIncoming: number[],
    resolution: ResolutionType
  ) => void;
  onSelectBlock: () => void;
}

export const ConflictBlockView: React.FC<ConflictBlockViewProps> = ({
  chunk,
  isActive,
  onUpdateConflict,
  onSelectBlock,
}) => {
  const isResolved = isConflictResolved(chunk);

  const handleToggleCurrentLine = (index: number) => {
    const isSelected = chunk.selectedCurrentLines.includes(index);
    let newSelected: number[];
    if (isSelected) {
      newSelected = chunk.selectedCurrentLines.filter((i) => i !== index);
    } else {
      newSelected = [...chunk.selectedCurrentLines, index];
    }
    onUpdateConflict(chunk.id, newSelected, chunk.selectedIncomingLines, 'unresolved');
  };

  const handleToggleIncomingLine = (index: number) => {
    const isSelected = chunk.selectedIncomingLines.includes(index);
    let newSelected: number[];
    if (isSelected) {
      newSelected = chunk.selectedIncomingLines.filter((i) => i !== index);
    } else {
      newSelected = [...chunk.selectedIncomingLines, index];
    }
    onUpdateConflict(chunk.id, chunk.selectedCurrentLines, newSelected, 'unresolved');
  };

  const handleTakeAllCurrent = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allIndices = chunk.currentLines.map((_, i) => i);
    onUpdateConflict(chunk.id, allIndices, [], 'current');
  };

  const handleTakeAllIncoming = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allIndices = chunk.incomingLines.map((_, i) => i);
    onUpdateConflict(chunk.id, [], allIndices, 'incoming');
  };

  const handleTakeBothCurrentFirst = (e: React.MouseEvent) => {
    e.stopPropagation();
    const curIndices = chunk.currentLines.map((_, i) => i);
    const incIndices = chunk.incomingLines.map((_, i) => i);
    onUpdateConflict(chunk.id, curIndices, incIndices, 'both-current-first');
  };

  const handleTakeBothIncomingFirst = (e: React.MouseEvent) => {
    e.stopPropagation();
    const curIndices = chunk.currentLines.map((_, i) => i);
    const incIndices = chunk.incomingLines.map((_, i) => i);
    onUpdateConflict(chunk.id, curIndices, incIndices, 'both-incoming-first');
  };

  const handleClearBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateConflict(chunk.id, [], [], 'unresolved');
  };

  return (
    <div
      id={`conflict-block-${chunk.conflictIndex}`}
      className={`conflict-block ${isActive ? 'active' : ''} ${
        isResolved ? 'resolved' : 'unresolved'
      }`}
      onClick={onSelectBlock}
    >
      <div className="conflict-block-header">
        <div className="conflict-block-title">
          <span>Conflict #{chunk.conflictIndex + 1}</span>
          <span
            className={`conflict-status-pill ${
              isResolved ? 'resolved' : 'unresolved'
            }`}
          >
            {isResolved ? 'Resolved' : 'Unresolved'}
          </span>
        </div>

        <div className="conflict-quick-buttons">
          <button
            className="btn btn-outline btn-sm"
            onClick={handleTakeAllCurrent}
            title="Accept all lines from Current (Ours)"
          >
            Take Current
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleTakeAllIncoming}
            title="Accept all lines from Incoming (Theirs)"
          >
            Take Incoming
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleTakeBothCurrentFirst}
            title="Take Current lines then Incoming lines"
          >
            Both (Current first)
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleTakeBothIncomingFirst}
            title="Take Incoming lines then Current lines"
          >
            Both (Incoming first)
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleClearBlock}
            title="Clear selections for this conflict"
          >
            <RotateCcwIcon className="w-3 h-3" size={12} />
            Clear
          </button>
        </div>
      </div>

      <div className="conflict-columns">
        {/* Current Column */}
        <div className="conflict-col current">
          {chunk.currentLines.length === 0 ? (
            <div className="empty-line-placeholder">&lt;Empty on Current&gt;</div>
          ) : (
            chunk.currentLines.map((line, lineIdx) => {
              const isSelected = chunk.selectedCurrentLines.includes(lineIdx);
              const originalLineNum = chunk.startOriginalLine + 1 + lineIdx;
              const tokens = chunk.currentTokenizedLines?.[lineIdx];

              return (
                <div
                  key={lineIdx}
                  className={`line-row current ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleCurrentLine(lineIdx);
                  }}
                  title="Click to toggle this line into merged result"
                >
                  <div className="line-gutter">
                    <input
                      type="checkbox"
                      className="line-checkbox current"
                      checked={isSelected}
                      onChange={() => {}} // Handled by row onClick
                      tabIndex={-1}
                    />
                    <span className="line-number">{originalLineNum}</span>
                  </div>
                  <div className="line-content">
                    {renderTokens(tokens, line)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Incoming Column */}
        <div className="conflict-col incoming">
          {chunk.incomingLines.length === 0 ? (
            <div className="empty-line-placeholder">&lt;Empty on Incoming&gt;</div>
          ) : (
            chunk.incomingLines.map((line, lineIdx) => {
              const isSelected = chunk.selectedIncomingLines.includes(lineIdx);
              const separatorOffset = chunk.currentLines.length + 1; // +1 for =======
              const originalLineNum = chunk.startOriginalLine + separatorOffset + 1 + lineIdx;
              const tokens = chunk.incomingTokenizedLines?.[lineIdx];

              return (
                <div
                  key={lineIdx}
                  className={`line-row incoming ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleIncomingLine(lineIdx);
                  }}
                  title="Click to toggle this line into merged result"
                >
                  <div className="line-gutter">
                    <input
                      type="checkbox"
                      className="line-checkbox incoming"
                      checked={isSelected}
                      onChange={() => {}} // Handled by row onClick
                      tabIndex={-1}
                    />
                    <span className="line-number">{originalLineNum}</span>
                  </div>
                  <div className="line-content">
                    {renderTokens(tokens, line)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
