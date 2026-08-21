import React from 'react';
import { FileChunk, ResolutionType } from '../../types.js';
import { ContextBlockView } from './ContextBlockView.js';
import { ConflictBlockView } from './ConflictBlockView.js';

interface SplitViewProps {
  chunks: FileChunk[];
  activeConflictIndex: number;
  onUpdateConflict: (
    conflictId: string,
    selectedCurrent: number[],
    selectedIncoming: number[],
    resolution: ResolutionType
  ) => void;
  onSelectConflict: (conflictIndex: number) => void;
}

export const SplitView: React.FC<SplitViewProps> = ({
  chunks,
  activeConflictIndex,
  onUpdateConflict,
  onSelectConflict,
}) => {
  return (
    <div className="diff-scroll-area">
      {chunks.map((chunk) => {
        if (chunk.type === 'context') {
          return <ContextBlockView key={chunk.id} chunk={chunk} />;
        }

        if (chunk.type === 'conflict') {
          const isActive = chunk.conflictIndex === activeConflictIndex;
          return (
            <ConflictBlockView
              key={chunk.id}
              chunk={chunk}
              isActive={isActive}
              onUpdateConflict={onUpdateConflict}
              onSelectBlock={() => onSelectConflict(chunk.conflictIndex)}
            />
          );
        }

        return null;
      })}
    </div>
  );
};
