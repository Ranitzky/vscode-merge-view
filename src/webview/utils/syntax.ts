import Prism from 'prismjs';

// Load language definitions in dependency order
import 'prismjs/components/prism-markup.js'; // HTML, XML, SVG
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-clike.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-jsx.js';
import 'prismjs/components/prism-tsx.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-markdown.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-rust.js';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-csharp.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-sql.js';

// Add hook to tag individual keywords with their specific keyword name (e.g. keyword-import, keyword-return)
Prism.hooks.add('wrap', (env) => {
  if (env.type === 'keyword') {
    const text = typeof env.content === 'string' ? env.content : '';
    if (text) {
      env.classes.push(`keyword-${text}`);
    }
  }
});

const EXTENSION_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  py: 'python',
  html: 'markup',
  htm: 'markup',
  xml: 'markup',
  svg: 'markup',
  css: 'css',
  scss: 'css',
  less: 'css',
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
};

export function getLanguageFromFilename(fileName: string): string {
  if (!fileName) return 'typescript';
  const parts = fileName.split('.');
  if (parts.length <= 1) return 'typescript';
  const ext = parts[parts.length - 1].toLowerCase();
  return EXTENSION_MAP[ext] || 'typescript';
}

/**
 * Highlights a string of code into HTML using Prism with the detected grammar.
 */
export function highlightCode(code: string, language: string): string {
  if (!code) return '';
  const grammar = Prism.languages[language] || Prism.languages.typescript || Prism.languages.javascript;
  if (!grammar) return escapeHtml(code);
  try {
    return Prism.highlight(code, grammar, language);
  } catch (err) {
    return escapeHtml(code);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
