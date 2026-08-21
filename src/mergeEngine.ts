import { FileChunk, ConflictChunk, ResolutionType } from './types.js';

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
