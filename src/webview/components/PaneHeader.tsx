import React from 'react';
import { GitMergeIcon } from './Icons.js';

interface PaneHeaderProps {
  currentLabel: string;
  incomingLabel: string;
}

export const PaneHeader: React.FC<PaneHeaderProps> = ({ currentLabel, incomingLabel }) => {
  return (
    <div className="pane-headers-row">
      <div className="pane-header-cell current">
        <div className="pane-label-group">
          <span className="pane-title current">
            <GitMergeIcon className="w-3.5 h-3.5" />
            Current Change (Ours)
          </span>
          <span className="branch-name-tag" title={currentLabel}>
            {currentLabel}
          </span>
        </div>
      </div>

      <div className="pane-header-cell incoming">
        <div className="pane-label-group">
          <span className="pane-title incoming">
            <GitMergeIcon className="w-3.5 h-3.5" />
            Incoming Change (Theirs)
          </span>
          <span className="branch-name-tag" title={incomingLabel}>
            {incomingLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
