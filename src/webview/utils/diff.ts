import * as Diff from 'diff';

export interface DiffSpan {
  text: string;
  type: 'added' | 'removed' | 'unchanged';
}

/**
 * Computes word-level diff spans between currentLine and incomingLine
 */
export function computeWordDiff(currentLine: string, incomingLine: string): {
  currentSpans: DiffSpan[];
  incomingSpans: DiffSpan[];
} {
  const diffs = Diff.diffWordsWithSpace(currentLine, incomingLine);

  const currentSpans: DiffSpan[] = [];
  const incomingSpans: DiffSpan[] = [];

  for (const part of diffs) {
    if (part.added) {
      incomingSpans.push({ text: part.value, type: 'added' });
    } else if (part.removed) {
      currentSpans.push({ text: part.value, type: 'removed' });
    } else {
      currentSpans.push({ text: part.value, type: 'unchanged' });
      incomingSpans.push({ text: part.value, type: 'unchanged' });
    }
  }

  return { currentSpans, incomingSpans };
}

/**
 * Computes block-level diff highlights for pairs of lines
 */
export function computeBlockDiffs(currentLines: string[], incomingLines: string[]): {
  currentDiffs: DiffSpan[][];
  incomingDiffs: DiffSpan[][];
} {
  const currentDiffs: DiffSpan[][] = [];
  const incomingDiffs: DiffSpan[][] = [];

  const minLen = Math.min(currentLines.length, incomingLines.length);

  for (let i = 0; i < minLen; i++) {
    const { currentSpans, incomingSpans } = computeWordDiff(currentLines[i], incomingLines[i]);
    currentDiffs.push(currentSpans);
    incomingDiffs.push(incomingSpans);
  }

  // Extra lines on current side
  for (let i = minLen; i < currentLines.length; i++) {
    currentDiffs.push([{ text: currentLines[i], type: 'removed' }]);
  }

  // Extra lines on incoming side
  for (let i = minLen; i < incomingLines.length; i++) {
    incomingDiffs.push([{ text: incomingLines[i], type: 'added' }]);
  }

  return { currentDiffs, incomingDiffs };
}
