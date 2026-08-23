import { createHighlighter, Highlighter } from 'shiki';
import * as vscode from 'vscode';
import { getActiveThemeJson } from './themeLoader.js';

export interface CodeToken {
  text: string;
  color?: string;
  fontStyle?: number; // 1: italic, 2: bold, 4: underline
}

export type TokenizedLine = CodeToken[];

let highlighterPromise: Promise<Highlighter> | null = null;
const loadedThemes = new Set<string>();

const SUPPORTED_LANGS = [
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'json',
  'python',
  'html',
  'css',
  'scss',
  'markdown',
  'yaml',
  'bash',
  'go',
  'rust',
  'c',
  'cpp',
  'csharp',
  'java',
  'sql',
  'php',
  'ruby',
  'xml',
  'vue',
  'svelte',
];

const EXTENSION_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  py: 'python',
  html: 'html',
  htm: 'html',
  xml: 'xml',
  svg: 'xml',
  css: 'css',
  scss: 'scss',
  md: 'markdown',
  markdown: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  go: 'go',
  rs: 'rust',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  hpp: 'cpp',
  cc: 'cpp',
  cs: 'csharp',
  java: 'java',
  sql: 'sql',
  php: 'php',
  rb: 'ruby',
  vue: 'vue',
  svelte: 'svelte',
};

export function getShikiLanguageFromFilename(fileName: string): string {
  if (!fileName) return 'typescript';
  const parts = fileName.split('.');
  if (parts.length <= 1) return 'typescript';
  const ext = parts[parts.length - 1].toLowerCase();
  return EXTENSION_MAP[ext] || 'typescript';
}

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['dark-plus', 'light-plus'],
      langs: SUPPORTED_LANGS,
    });
  }
  return highlighterPromise;
}

export async function tokenizeLines(
  lines: string[],
  fileName: string
): Promise<TokenizedLine[]> {
  if (lines.length === 0) return [];

  const lang = getShikiLanguageFromFilename(fileName);
  const highlighter = await getHighlighter();

  const themeJson = getActiveThemeJson();
  let themeToUse = 'dark-plus';

  if (themeJson) {
    try {
      const themeId = themeJson.name || 'custom';
      if (!loadedThemes.has(themeId)) {
        await highlighter.loadTheme(themeJson);
        loadedThemes.add(themeId);
      }
      themeToUse = themeId;
    } catch (e) {
      console.warn('Failed to load custom theme into Shiki, using fallback:', e);
      const isLight = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light;
      themeToUse = isLight ? 'light-plus' : 'dark-plus';
    }
  } else {
    const isLight = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light;
    themeToUse = isLight ? 'light-plus' : 'dark-plus';
  }

  const fullCode = lines.join('\n');
  try {
    const tokensResult = highlighter.codeToTokens(fullCode, {
      lang: SUPPORTED_LANGS.includes(lang) ? lang : 'typescript',
      theme: themeToUse,
    });

    return tokensResult.tokens.map((lineTokens) =>
      lineTokens.map((t) => ({
        text: t.content,
        color: t.color,
        fontStyle: t.fontStyle,
      }))
    );
  } catch (err) {
    console.error('Error tokenizing code with Shiki:', err);
    return lines.map((l) => [{ text: l }]);
  }
}
