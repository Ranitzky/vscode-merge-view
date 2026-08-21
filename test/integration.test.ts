import { describe, it, expect } from 'vitest';
import { parseConflictDocument } from '../src/conflictParser.js';
import { assembleDocument, isConflictResolved, getLinesForConflict } from '../src/mergeEngine.js';
import { computeWordDiff, computeBlockDiffs } from '../src/webview/utils/diff.js';
import { ConflictChunk } from '../src/types.js';

describe('Word Diff Calculation', () => {
  it('should identify added, removed, and unchanged word spans', () => {
    const cur = 'const color = "red";';
    const inc = 'const color = "blue";';

    const { currentSpans, incomingSpans } = computeWordDiff(cur, inc);

    expect(currentSpans.some(s => s.type === 'removed' && s.text.includes('red'))).toBe(true);
    expect(incomingSpans.some(s => s.type === 'added' && s.text.includes('blue'))).toBe(true);
  });

  it('should compute block diffs for multiple lines', () => {
    const curLines = ['line 1', 'line 2 (ours)'];
    const incLines = ['line 1', 'line 2 (theirs)', 'line 3'];

    const { currentDiffs, incomingDiffs } = computeBlockDiffs(curLines, incLines);
    expect(currentDiffs.length).toBe(2);
    expect(incomingDiffs.length).toBe(3);
  });
});

describe('Complex Merge Scenarios', () => {
  it('should handle both-current-first and both-incoming-first resolutions', () => {
    const sample = `<<<<<<< HEAD
const a = 1;
=======
const b = 2;
>>>>>>> feature`;

    const parsed = parseConflictDocument(sample);
    const chunk = parsed.chunks[0] as ConflictChunk;

    chunk.resolution = 'both-current-first';
    expect(getLinesForConflict(chunk)).toEqual(['const a = 1;', 'const b = 2;']);

    chunk.resolution = 'both-incoming-first';
    expect(getLinesForConflict(chunk)).toEqual(['const b = 2;', 'const a = 1;']);
  });

  it('should preserve CRLF line endings when requested', () => {
    const sample = 'line1\r\n<<<<<<< HEAD\r\nours\r\n=======\r\ntheirs\r\n>>>>>>> feature\r\nline2';
    const parsed = parseConflictDocument(sample);
    expect(parsed.eol).toBe('\r\n');

    const chunk = parsed.chunks[1] as ConflictChunk;
    chunk.resolution = 'incoming';

    const result = assembleDocument(parsed.chunks, parsed.eol);
    expect(result).toBe('line1\r\ntheirs\r\nline2');
  });

  it('should handle custom direct edit overrides per block', () => {
    const sample = `<<<<<<< HEAD
broken code
=======
more broken code
>>>>>>> feature`;

    const parsed = parseConflictDocument(sample);
    const chunk = parsed.chunks[0] as ConflictChunk;

    chunk.resolution = 'custom';
    chunk.customText = 'fixed code manually';

    const result = assembleDocument(parsed.chunks, '\n');
    expect(result).toBe('fixed code manually');
  });
});
