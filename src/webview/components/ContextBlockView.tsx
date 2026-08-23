import React, { useState } from 'react';
import { ContextChunk } from '../../types.js';
import { renderTokens } from '../utils/tokenRenderer.js';
import { LayersIcon } from './Icons.js';

interface ContextBlockViewProps {
  chunk: ContextChunk;

}

export const ContextBlockView: React.FC<ContextBlockViewProps> = ({ chunk }) => {
  const [isExpanded, setIsExpanded] = useState(chunk.lines.length <= 15);
  const shouldCollapse = chunk.lines.length > 15 && !isExpanded;

  if (shouldCollapse) {
    const previewLinesCount = 3;
    const topLines = chunk.lines.slice(0, previewLinesCount);
    const bottomLines = chunk.lines.slice(-previewLinesCount);
    const hiddenCount = chunk.lines.length - previewLinesCount * 2;

    return (
      <div className="context-block">
        {topLines.map((line, idx) => (
          <div key={`top-${idx}`} className="context-row">
            <div className="context-gutter">{chunk.startOriginalLine + idx}</div>
            <div className="context-content">
              {renderTokens(chunk.tokenizedLines?.[idx], line)}
            </div>
          </div>
        ))}

        <div
          className="context-collapsed-banner"
          onClick={() => setIsExpanded(true)}
          title="Click to expand context"
        >
          <LayersIcon className="w-3.5 h-3.5" size={13} />
          <span>Show {hiddenCount} unchanged lines</span>
        </div>

        {bottomLines.map((line, idx) => {
          const actualLineNo = chunk.startOriginalLine + chunk.lines.length - previewLinesCount + idx;
          const tokenIdx = chunk.lines.length - previewLinesCount + idx;
          return (
            <div key={`bottom-${idx}`} className="context-row">
              <div className="context-gutter">{actualLineNo}</div>
              <div className="context-content">
                {renderTokens(chunk.tokenizedLines?.[tokenIdx], line)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="context-block">
      {chunk.lines.map((line, idx) => (
        <div key={idx} className="context-row">
          <div className="context-gutter">{chunk.startOriginalLine + idx}</div>
          <div className="context-content">
            {renderTokens(chunk.tokenizedLines?.[idx], line)}
          </div>
        </div>
      ))}
    </div>
  );
};
