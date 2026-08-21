import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import {
  FileChunk,
  ConflictChunk,
  ParsedConflictDocument,
  ResolutionType,
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from '../types.js';
import { Header } from './components/Header.js';
import { PaneHeader } from './components/PaneHeader.js';
import { SplitView } from './components/SplitView.js';
import { ResultEditor } from './components/ResultEditor.js';
import { assembleDocument, isConflictResolved } from '../mergeEngine.js';
import { GitMergeIcon } from './components/Icons.js';

// Declare VS Code API acquire function
declare function acquireVsCodeApi(): {
  postMessage: (message: WebviewToExtensionMessage) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

// Global VS Code API handle (call only once per session)
const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : {
  postMessage: (msg: unknown) => console.log('VSCode msg:', msg),
  getState: () => null,
  setState: () => {},
};

export const App: React.FC = () => {
  const [fileName, setFileName] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedConflictDocument | null>(null);
  const [activeConflictIndex, setActiveConflictIndex] = useState<number>(0);
  const [splitRatio, setSplitRatio] = useState<number>(0.55); // 55% top, 45% bottom
  const [isDirectEditMode, setIsDirectEditMode] = useState<boolean>(false);
  const [manualResultOverride, setManualResultOverride] = useState<string | null>(null);

  const isDraggingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Send READY message on mount
  useEffect(() => {
    vscode.postMessage({ type: 'READY' });

    const handleMessage = (event: MessageEvent<ExtensionToWebviewMessage>) => {
      const msg = event.data;
      if (msg.type === 'INIT_DOCUMENT') {
        setFileName(msg.fileName);
        setParsed(msg.parsed);
        setManualResultOverride(null);
      } else if (msg.type === 'DOCUMENT_UPDATED') {
        setParsed(msg.parsed);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Compute conflicts list
  const conflictChunks = useMemo(() => {
    if (!parsed) return [];
    return parsed.chunks.filter((c): c is ConflictChunk => c.type === 'conflict');
  }, [parsed]);

  const totalConflicts = conflictChunks.length;

  const unresolvedCount = useMemo(() => {
    return conflictChunks.filter((c) => !isConflictResolved(c)).length;
  }, [conflictChunks]);

  // Labels for panes
  const currentLabel = conflictChunks[0]?.currentLabel || 'HEAD';
  const incomingLabel = conflictChunks[0]?.incomingLabel || 'Incoming Branch';

  // Assembled result text
  const assembledText = useMemo(() => {
    if (manualResultOverride !== null) {
      return manualResultOverride;
    }
    if (!parsed) return '';
    return assembleDocument(parsed.chunks, parsed.eol, false);
  }, [parsed, manualResultOverride]);

  // Scroll active conflict into view
  const scrollToConflict = useCallback((index: number) => {
    const el = document.getElementById(`conflict-block-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleNavigatePrev = useCallback(() => {
    if (totalConflicts === 0) return;
    const newIdx = (activeConflictIndex - 1 + totalConflicts) % totalConflicts;
    setActiveConflictIndex(newIdx);
    scrollToConflict(newIdx);
  }, [activeConflictIndex, totalConflicts, scrollToConflict]);

  const handleNavigateNext = useCallback(() => {
    if (totalConflicts === 0) return;
    const newIdx = (activeConflictIndex + 1) % totalConflicts;
    setActiveConflictIndex(newIdx);
    scrollToConflict(newIdx);
  }, [activeConflictIndex, totalConflicts, scrollToConflict]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S / Ctrl+S
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Alt+[ or Alt+p: Prev conflict
      if (e.altKey && (e.key === '[' || e.key === 'p')) {
        e.preventDefault();
        handleNavigatePrev();
      }
      // Alt+] or Alt+n: Next conflict
      if (e.altKey && (e.key === ']' || e.key === 'n')) {
        e.preventDefault();
        handleNavigateNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleUpdateConflict = (
    conflictId: string,
    selectedCurrent: number[],
    selectedIncoming: number[],
    resolution: ResolutionType
  ) => {
    if (!parsed) return;

    // Clear manual override when user interacts with checkboxes
    if (manualResultOverride !== null) {
      setManualResultOverride(null);
    }

    const updatedChunks = parsed.chunks.map((chunk) => {
      if (chunk.type === 'conflict' && chunk.id === conflictId) {
        return {
          ...chunk,
          selectedCurrentLines: selectedCurrent,
          selectedIncomingLines: selectedIncoming,
          resolution,
        };
      }
      return chunk;
    });

    setParsed({
      ...parsed,
      chunks: updatedChunks,
    });

    vscode.postMessage({
      type: 'UPDATE_CONFLICT_SELECTION',
      conflictId,
      selectedCurrentLines: selectedCurrent,
      selectedIncomingLines: selectedIncoming,
      resolution,
    });
  };

  const handleResolveAllCurrent = () => {
    if (!parsed) return;
    setManualResultOverride(null);
    const updatedChunks = parsed.chunks.map((chunk) => {
      if (chunk.type === 'conflict') {
        return {
          ...chunk,
          selectedCurrentLines: chunk.currentLines.map((_, i) => i),
          selectedIncomingLines: [],
          resolution: 'current' as ResolutionType,
        };
      }
      return chunk;
    });
    setParsed({ ...parsed, chunks: updatedChunks });
    vscode.postMessage({ type: 'RESOLVE_ALL_CURRENT' });
  };

  const handleResolveAllIncoming = () => {
    if (!parsed) return;
    setManualResultOverride(null);
    const updatedChunks = parsed.chunks.map((chunk) => {
      if (chunk.type === 'conflict') {
        return {
          ...chunk,
          selectedCurrentLines: [],
          selectedIncomingLines: chunk.incomingLines.map((_, i) => i),
          resolution: 'incoming' as ResolutionType,
        };
      }
      return chunk;
    });
    setParsed({ ...parsed, chunks: updatedChunks });
    vscode.postMessage({ type: 'RESOLVE_ALL_INCOMING' });
  };

  const handleResetAll = () => {
    if (!parsed) return;
    setManualResultOverride(null);
    const updatedChunks = parsed.chunks.map((chunk) => {
      if (chunk.type === 'conflict') {
        return {
          ...chunk,
          selectedCurrentLines: [],
          selectedIncomingLines: [],
          resolution: 'unresolved' as ResolutionType,
        };
      }
      return chunk;
    });
    setParsed({ ...parsed, chunks: updatedChunks });
    vscode.postMessage({ type: 'RESET_ALL' });
  };

  const handleSave = () => {
    vscode.postMessage({
      type: 'SAVE_AND_RESOLVE',
      resolvedContent: assembledText,
    });
  };

  // Draggable divider handlers
  const handleMouseDown = () => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'row-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const topOffset = e.clientY - rect.top;
      const newRatio = Math.max(0.2, Math.min(0.8, topOffset / rect.height));
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!parsed) {
    return (
      <div className="empty-state">
        <GitMergeIcon className="w-8 h-8" />
        <p>Loading conflict data...</p>
      </div>
    );
  }

  if (totalConflicts === 0) {
    return (
      <div className="empty-state">
        <GitMergeIcon className="w-8 h-8" />
        <p>No merge conflicts found in this file.</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header
        fileName={fileName}
        totalConflicts={totalConflicts}
        unresolvedCount={unresolvedCount}
        activeConflictIndex={activeConflictIndex}
        onNavigatePrev={handleNavigatePrev}
        onNavigateNext={handleNavigateNext}
        onResolveAllCurrent={handleResolveAllCurrent}
        onResolveAllIncoming={handleResolveAllIncoming}
        onResetAll={handleResetAll}
        onSave={handleSave}
      />

      <div className="main-content" ref={containerRef}>
        {/* Top 2-pane split */}
        <div
          className="top-split-container"
          style={{ height: `${splitRatio * 100}%` }}
        >
          <PaneHeader
            currentLabel={currentLabel}
            incomingLabel={incomingLabel}
          />
          <SplitView
            chunks={parsed.chunks}
            activeConflictIndex={activeConflictIndex}
            onUpdateConflict={handleUpdateConflict}
            onSelectConflict={(idx) => setActiveConflictIndex(idx)}
          />
        </div>

        {/* Resizer handle */}
        <div
          className="split-resizer"
          onMouseDown={handleMouseDown}
          title="Drag to resize panels"
        >
          <div className="split-resizer-handle" />
        </div>

        {/* Bottom live result pane */}
        <div
          className="bottom-result-container"
          style={{ height: `${(1 - splitRatio) * 100}%` }}
        >
          <ResultEditor
            assembledText={assembledText}
            unresolvedCount={unresolvedCount}
            totalConflicts={totalConflicts}
            isDirectEditMode={isDirectEditMode}
            onToggleDirectEditMode={(enabled) => setIsDirectEditMode(enabled)}
            onDirectEditChange={(text) => setManualResultOverride(text)}
          />
        </div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
