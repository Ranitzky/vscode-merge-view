import { FileChunk, ConflictChunk, ResolutionType, TokenizedLine } from './types.js';

export function getLinesForConflict(chunk: ConflictChunk, keepUnresolvedMarkers = false): string[] {
  if (chunk.resolution === 'custom' && chunk.customText !== undefined) {
    return chunk.customText.split(/\r?\n/);
  }

  if (chunk.resolution === 'current') {
    return [...chunk.currentLines];
  }

  if (chunk.resolution === 'incoming') {
    return [...chunk.incomingLines];
  }

  if (chunk.resolution === 'both-current-first') {
    return [...chunk.currentLines, ...chunk.incomingLines];
  }

  if (chunk.resolution === 'both-incoming-first') {
    return [...chunk.incomingLines, ...chunk.currentLines];
  }

  // Line-by-line selection or unresolved
  const hasCurrentSelections = chunk.selectedCurrentLines.length > 0;
  const hasIncomingSelections = chunk.selectedIncomingLines.length > 0;

  if (hasCurrentSelections || hasIncomingSelections) {
    const sortedCurrent = [...chunk.selectedCurrentLines].sort((a, b) => a - b);
    const sortedIncoming = [...chunk.selectedIncomingLines].sort((a, b) => a - b);

    const currentSelectedLines = sortedCurrent.map((idx) => chunk.currentLines[idx]).filter((l) => l !== undefined);
    const incomingSelectedLines = sortedIncoming.map((idx) => chunk.incomingLines[idx]).filter((l) => l !== undefined);

    return [...currentSelectedLines, ...incomingSelectedLines];
  }

  // If completely unresolved and requested to keep markers
  if (keepUnresolvedMarkers) {
    const result: string[] = [];
    result.push(`<<<<<<< ${chunk.currentLabel}`);
    result.push(...chunk.currentLines);
    if (chunk.baseLines && chunk.baseLines.length > 0) {
      result.push(`||||||| ${chunk.baseLabel || 'base'}`);
      result.push(...chunk.baseLines);
    }
    result.push('=======');
    result.push(...chunk.incomingLines);
    result.push(`>>>>>>> ${chunk.incomingLabel}`);
    return result;
  }

  // Unresolved without markers -> empty lines for this block
  return [];
}

export function isConflictResolved(chunk: ConflictChunk): boolean {
  if (chunk.resolution !== 'unresolved') {
    return true;
  }
  return chunk.selectedCurrentLines.length > 0 || chunk.selectedIncomingLines.length > 0;
}

export function assembleDocument(chunks: FileChunk[], eol: string, keepUnresolvedMarkers = false): string {
  const allLines: string[] = [];

  for (const chunk of chunks) {
    if (chunk.type === 'context') {
      allLines.push(...chunk.lines);
    } else if (chunk.type === 'conflict') {
      const conflictLines = getLinesForConflict(chunk, keepUnresolvedMarkers);
      allLines.push(...conflictLines);
    }
  }

  return allLines.join(eol);
}

export interface AssembledLineItem {
  text: string;
  tokens?: TokenizedLine;
}

export function getAssembledLineItems(chunks: FileChunk[]): AssembledLineItem[] {
  const allItems: AssembledLineItem[] = [];

  for (const chunk of chunks) {
    if (chunk.type === 'context') {
      for (let i = 0; i < chunk.lines.length; i++) {
        allItems.push({
          text: chunk.lines[i],
          tokens: chunk.tokenizedLines?.[i],
        });
      }
    } else if (chunk.type === 'conflict') {
      if (chunk.resolution === 'custom' && chunk.customText !== undefined) {
        const customLines = chunk.customText.split(/\r?\n/);
        for (const l of customLines) {
          allItems.push({ text: l });
        }
      } else if (chunk.resolution === 'current') {
        for (let i = 0; i < chunk.currentLines.length; i++) {
          allItems.push({
            text: chunk.currentLines[i],
            tokens: chunk.currentTokenizedLines?.[i],
          });
        }
      } else if (chunk.resolution === 'incoming') {
        for (let i = 0; i < chunk.incomingLines.length; i++) {
          allItems.push({
            text: chunk.incomingLines[i],
            tokens: chunk.incomingTokenizedLines?.[i],
          });
        }
      } else if (chunk.resolution === 'both-current-first') {
        for (let i = 0; i < chunk.currentLines.length; i++) {
          allItems.push({
            text: chunk.currentLines[i],
            tokens: chunk.currentTokenizedLines?.[i],
          });
        }
        for (let i = 0; i < chunk.incomingLines.length; i++) {
          allItems.push({
            text: chunk.incomingLines[i],
            tokens: chunk.incomingTokenizedLines?.[i],
          });
        }
      } else if (chunk.resolution === 'both-incoming-first') {
        for (let i = 0; i < chunk.incomingLines.length; i++) {
          allItems.push({
            text: chunk.incomingLines[i],
            tokens: chunk.incomingTokenizedLines?.[i],
          });
        }
        for (let i = 0; i < chunk.currentLines.length; i++) {
          allItems.push({
            text: chunk.currentLines[i],
            tokens: chunk.currentTokenizedLines?.[i],
          });
        }
      } else {
        // Line-by-line selection
        const sortedCurrent = [...chunk.selectedCurrentLines].sort((a, b) => a - b);
        const sortedIncoming = [...chunk.selectedIncomingLines].sort((a, b) => a - b);

        for (const idx of sortedCurrent) {
          if (chunk.currentLines[idx] !== undefined) {
            allItems.push({
              text: chunk.currentLines[idx],
              tokens: chunk.currentTokenizedLines?.[idx],
            });
          }
        }
        for (const idx of sortedIncoming) {
          if (chunk.incomingLines[idx] !== undefined) {
            allItems.push({
              text: chunk.incomingLines[idx],
              tokens: chunk.incomingTokenizedLines?.[idx],
            });
          }
        }
      }
    }
  }

  return allItems;
}
