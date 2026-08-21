import { describe, it, expect } from 'vitest';
import { parseConflictDocument } from '../src/conflictParser.js';
import { assembleDocument, isConflictResolved } from '../src/mergeEngine.js';
import { ConflictChunk } from '../src/types.js';

describe('Conflict Parser', () => {
  it('should parse a standard 2-way conflict', () => {
    const sample = `function test() {
<<<<<<< HEAD
  const greeting = "Hello World";
=======
  const greeting = "Hi Universe";
>>>>>>> feature-branch
  console.log(greeting);
}`;

    const parsed = parseConflictDocument(sample);
    expect(parsed.hasConflicts).toBe(true);
    expect(parsed.totalConflicts).toBe(1);
    expect(parsed.chunks.length).toBe(3);

    expect(parsed.chunks[0].type).toBe('context');
    expect(parsed.chunks[0].lines).toEqual(['function test() {']);

    const conflict = parsed.chunks[1] as ConflictChunk;
    expect(conflict.type).toBe('conflict');
    expect(conflict.currentLabel).toBe('HEAD');
    expect(conflict.incomingLabel).toBe('feature-branch');
    expect(conflict.currentLines).toEqual(['  const greeting = "Hello World";']);
    expect(conflict.incomingLines).toEqual(['  const greeting = "Hi Universe";']);

    expect(parsed.chunks[2].type).toBe('context');
    expect(parsed.chunks[2].lines).toEqual(['  console.log(greeting);', '}']);
  });

  it('should parse multiple conflict blocks', () => {
    const sample = `import a from 'a';
<<<<<<< HEAD
const x = 1;
=======
const x = 2;
>>>>>>> b1
console.log(x);
<<<<<<< HEAD
const y = 10;
=======
const y = 20;
>>>>>>> b2
console.log(y);`;

    const parsed = parseConflictDocument(sample);
    expect(parsed.totalConflicts).toBe(2);
    expect(parsed.chunks.length).toBe(5);
  });

  it('should parse diff3 conflict with base ancestor', () => {
    const sample = `<<<<<<< HEAD
const val = "ours";
||||||| base
const val = "base";
=======
const val = "theirs";
>>>>>>> incoming`;

    const parsed = parseConflictDocument(sample);
    expect(parsed.totalConflicts).toBe(1);
    const conflict = parsed.chunks[0] as ConflictChunk;
    expect(conflict.baseLabel).toBe('base');
    expect(conflict.baseLines).toEqual(['const val = "base";']);
    expect(conflict.currentLines).toEqual(['const val = "ours";']);
    expect(conflict.incomingLines).toEqual(['const val = "theirs";']);
  });
});

describe('Merge Engine', () => {
  it('should resolve using current lines', () => {
    const sample = `line1
<<<<<<< HEAD
ours1
ours2
=======
theirs1
>>>>>>> incoming
line2`;

    const parsed = parseConflictDocument(sample);
    const conflict = parsed.chunks[1] as ConflictChunk;
    conflict.resolution = 'current';

    const output = assembleDocument(parsed.chunks, '\n');
    expect(output).toBe(`line1\nours1\nours2\nline2`);
  });

  it('should resolve using incoming lines', () => {
    const sample = `line1
<<<<<<< HEAD
ours1
=======
theirs1
theirs2
>>>>>>> incoming
line2`;

    const parsed = parseConflictDocument(sample);
    const conflict = parsed.chunks[1] as ConflictChunk;
    conflict.resolution = 'incoming';

    const output = assembleDocument(parsed.chunks, '\n');
    expect(output).toBe(`line1\ntheirs1\ntheirs2\nline2`);
  });

  it('should support line-by-line granular selection', () => {
    const sample = `header
<<<<<<< HEAD
line A (ours)
line B (ours)
=======
line 1 (theirs)
line 2 (theirs)
>>>>>>> incoming
footer`;

    const parsed = parseConflictDocument(sample);
    const conflict = parsed.chunks[1] as ConflictChunk;
    // Select line B from current (index 1) and line 1 from incoming (index 0)
    conflict.selectedCurrentLines = [1];
    conflict.selectedIncomingLines = [0];

    expect(isConflictResolved(conflict)).toBe(true);

    const output = assembleDocument(parsed.chunks, '\n');
    expect(output).toBe(`header\nline B (ours)\nline 1 (theirs)\nfooter`);
  });
});
