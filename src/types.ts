export interface CodeToken {
  text: string;
  color?: string;
  fontStyle?: number;
}

export type TokenizedLine = CodeToken[];

export interface ContextChunk {
  type: 'context';
  id: string;
  lines: string[];
  tokenizedLines?: TokenizedLine[];
  startOriginalLine: number;
}

export type ResolutionType = 'unresolved' | 'current' | 'incoming' | 'both-current-first' | 'both-incoming-first' | 'custom';

export interface ConflictChunk {
  type: 'conflict';
  id: string;
  conflictIndex: number;
  startOriginalLine: number;
  endOriginalLine: number;
  currentLabel: string;
  incomingLabel: string;
  baseLabel?: string;
  currentLines: string[];
  incomingLines: string[];
  baseLines?: string[];
  currentTokenizedLines?: TokenizedLine[];
  incomingTokenizedLines?: TokenizedLine[];
  // Selection state: line indices (0-based within side) selected
  selectedCurrentLines: number[];
  selectedIncomingLines: number[];
  resolution: ResolutionType;
  customText?: string;
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
