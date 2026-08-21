import { ContextChunk, ConflictChunk, FileChunk, ParsedConflictDocument } from './types.js';

export function parseConflictDocument(rawContent: string): ParsedConflictDocument {
  // Detect line endings
  const isCrlf = rawContent.includes('\r\n');
  const eol = isCrlf ? '\r\n' : '\n';
  const lines = rawContent.split(/\r?\n/);

  const chunks: FileChunk[] = [];
  let conflictCounter = 0;

  let currentContextLines: string[] = [];
  let contextStartLine = 1;

  let inConflict = false;
  let inBase = false;
  let inIncoming = false;

  let currentConflict: Partial<ConflictChunk> | null = null;
  let currentSideLines: string[] = [];
  let baseSideLines: string[] = [];
  let incomingSideLines: string[] = [];

  const flushContext = (endLine: number) => {
    if (currentContextLines.length > 0) {
      chunks.push({
        type: 'context',
        id: `context-${chunks.length}`,
        lines: [...currentContextLines],
        startOriginalLine: contextStartLine,
      });
      currentContextLines = [];
    }
    contextStartLine = endLine + 1;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    if (!inConflict) {
      if (line.startsWith('<<<<<<<')) {
        // Start of conflict
        flushContext(lineNumber - 1);
        inConflict = true;
        inBase = false;
        inIncoming = false;

        const currentLabel = line.replace(/^<<<<<<<\s*/, '').trim() || 'Current Change (HEAD)';
        currentSideLines = [];
        baseSideLines = [];
        incomingSideLines = [];

        currentConflict = {
          type: 'conflict',
          id: `conflict-${conflictCounter}`,
          conflictIndex: conflictCounter,
          startOriginalLine: lineNumber,
          currentLabel,
          selectedCurrentLines: [],
          selectedIncomingLines: [],
          resolution: 'unresolved',
        };
        conflictCounter++;
      } else {
        currentContextLines.push(line);
      }
    } else {
      // In conflict
      if (!inBase && !inIncoming && line.startsWith('|||||||')) {
        // Diff3 ancestor marker
        inBase = true;
        const baseLabel = line.replace(/^\|\|\|\|\|\|\|\s*/, '').trim() || 'Common Ancestor';
        if (currentConflict) {
          currentConflict.baseLabel = baseLabel;
        }
      } else if (!inIncoming && line.startsWith('=======')) {
        // Separator between current/base and incoming
        inBase = false;
        inIncoming = true;
      } else if (inIncoming && line.startsWith('>>>>>>>')) {
        // End of conflict
        const incomingLabel = line.replace(/^>>>>>>>\s*/, '').trim() || 'Incoming Change';
        if (currentConflict) {
          currentConflict.incomingLabel = incomingLabel;
          currentConflict.currentLines = currentSideLines;
          currentConflict.incomingLines = incomingSideLines;
          if (baseSideLines.length > 0) {
            currentConflict.baseLines = baseSideLines;
          }
          currentConflict.endOriginalLine = lineNumber;

          chunks.push(currentConflict as ConflictChunk);
        }

        inConflict = false;
        inBase = false;
        inIncoming = false;
        currentConflict = null;
        contextStartLine = lineNumber + 1;
      } else {
        // Collect line for the appropriate section
        if (inIncoming) {
          incomingSideLines.push(line);
        } else if (inBase) {
          baseSideLines.push(line);
        } else {
          currentSideLines.push(line);
        }
      }
    }
  }

  // Flush any trailing context
  if (currentContextLines.length > 0 || chunks.length === 0) {
    flushContext(lines.length);
  }

  return {
    chunks,
    totalConflicts: conflictCounter,
    hasConflicts: conflictCounter > 0,
    rawText: rawContent,
    eol,
  };
}
