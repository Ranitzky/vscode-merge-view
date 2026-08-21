export interface LineItem {
  index: number; // 0-indexed line within this side of conflict
  text: string;
}

export interface ContextChunk {
  type: 'context';
  id: string;
  lines: string[];
  startOriginalLine: number;
}

export type ResolutionType = 'unresolved' | 'current' | 'incoming' | 'both-current-first' | 'both-incoming-first' | 'custom';

export interface ConflictChunk {
  type: 'conflict';
  id: string; // e.g. "conflict-0", "conflict-1"
  conflictIndex: number; // 0-indexed among conflicts
  startOriginalLine: number;
  endOriginalLine: number;
  currentLabel: string;
  incomingLabel: string;
  baseLabel?: string;
  currentLines: string[];
  incomingLines: string[];
  baseLines?: string[];
  // Selection state: line indices (0-based within side) selected
  selectedCurrentLines: number[];
  selectedIncomingLines: number[];
  resolution: ResolutionType;
  customText?: string; // if user edited directly for this block
}

export type FileChunk = ContextChunk | ConflictChunk;

export interface ParsedConflictDocument {
  chunks: FileChunk[];
  totalConflicts: number;
  hasConflicts: boolean;
  rawText: string;
  eol: string; // '\n' or '\r\n'
}

// Extension <-> Webview message protocol
export type ExtensionToWebviewMessage =
  | {
      type: 'INIT_DOCUMENT';
      filePath: string;
      fileName: string;
      parsed: ParsedConflictDocument;
    }
  | {
      type: 'DOCUMENT_UPDATED';
      parsed: ParsedConflictDocument;
    };

export type WebviewToExtensionMessage =
  | {
      type: 'RESOLVE_ALL_CURRENT';
    }
  | {
      type: 'RESOLVE_ALL_INCOMING';
    }
  | {
      type: 'RESET_ALL';
    }
  | {
      type: 'UPDATE_CONFLICT_SELECTION';
      conflictId: string;
      selectedCurrentLines: number[];
      selectedIncomingLines: number[];
      resolution: ResolutionType;
      customText?: string;
    }
  | {
      type: 'SAVE_AND_RESOLVE';
      resolvedContent: string;
    }
  | {
      type: 'READY';
    };
