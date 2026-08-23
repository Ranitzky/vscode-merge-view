import React from 'react';
import { CodeToken, TokenizedLine } from '../../types.js';
import { DiffSpan } from './diff.js';

const BRACKET_PALETTE = [
  'var(--vscode-editorBracketHighlight-foreground1, #ffd700)',
  'var(--vscode-editorBracketHighlight-foreground2, #da70d6)',
  'var(--vscode-editorBracketHighlight-foreground3, #179fff)',
];

const OPEN_BRACKETS = new Set(['{', '(', '[']);
const CLOSE_BRACKETS = new Set(['}', ')', ']']);

export function renderTokens(
  tokens?: TokenizedLine,
  fallbackText?: string
): React.ReactNode {
  if (!tokens || tokens.length === 0) {
    return fallbackText || ' ';
  }

  let depth = 0;
  const elements: React.ReactNode[] = [];

  for (let tIdx = 0; tIdx < tokens.length; tIdx++) {
    const token = tokens[tIdx];
    const text = token.text;

    // Check if token contains any bracket characters
    if (/[{}()\[\]]/.test(text)) {
      const parts = text.split(/([{}()\[\]])/);
      for (let pIdx = 0; pIdx < parts.length; pIdx++) {
        const part = parts[pIdx];
        if (!part) continue;

        if (OPEN_BRACKETS.has(part)) {
          const bracketColor = BRACKET_PALETTE[depth % 3];
          depth++;
          elements.push(
            <span
              key={`${tIdx}-${pIdx}`}
              style={{ color: bracketColor, fontWeight: 600 }}
            >
              {part}
            </span>
          );
        } else if (CLOSE_BRACKETS.has(part)) {
          depth = Math.max(0, depth - 1);
          const bracketColor = BRACKET_PALETTE[depth % 3];
          elements.push(
            <span
              key={`${tIdx}-${pIdx}`}
              style={{ color: bracketColor, fontWeight: 600 }}
            >
              {part}
            </span>
          );
        } else {
          const style: React.CSSProperties = {};
          if (token.color) style.color = token.color;
          if (token.fontStyle === 1) style.fontStyle = 'italic';
          if (token.fontStyle === 2) style.fontWeight = 'bold';
          if (token.fontStyle === 4) style.textDecoration = 'underline';

          elements.push(
            <span key={`${tIdx}-${pIdx}`} style={style}>
              {part}
            </span>
          );
        }
      }
    } else {
      const style: React.CSSProperties = {};
      if (token.color) style.color = token.color;
      if (token.fontStyle === 1) style.fontStyle = 'italic';
      if (token.fontStyle === 2) style.fontWeight = 'bold';
      if (token.fontStyle === 4) style.textDecoration = 'underline';

      elements.push(
        <span key={tIdx} style={style}>
          {text}
        </span>
      );
    }
  }

  return elements;
}

/**
 * Combines token colors with diff span highlights
 */
export function renderDiffWithTokens(
  lineText: string,
  tokens?: TokenizedLine,
  diffSpans?: DiffSpan[]
): React.ReactNode {
  return renderTokens(tokens, lineText);
}
