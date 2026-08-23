import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Strips comments from JSONC/JSON5 strings
 */
function stripJsonComments(jsonString: string): string {
  return jsonString.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => (g ? '' : m));
}

/**
 * Recursively loads a theme JSON and all its included base themes
 */
function loadThemeRecursive(themePath: string, visited = new Set<string>()): any | null {
  if (!fs.existsSync(themePath) || visited.has(themePath)) {
    return null;
  }
  visited.add(themePath);

  try {
    const raw = fs.readFileSync(themePath, 'utf8');
    const parsed = JSON.parse(stripJsonComments(raw));

    let base: any = {};
    if (parsed.include && typeof parsed.include === 'string') {
      const incPath = path.resolve(path.dirname(themePath), parsed.include);
      base = loadThemeRecursive(incPath, visited) || {};
    }

    return {
      ...base,
      ...parsed,
      tokenColors: [
        ...(Array.isArray(base.tokenColors) ? base.tokenColors : []),
        ...(Array.isArray(parsed.tokenColors) ? parsed.tokenColors : []),
      ],
      colors: {
        ...(base.colors || {}),
        ...(parsed.colors || {})
      },
    };
  } catch (err) {
    console.error(`Error loading theme file at ${themePath}:`, err);
    return null;
  }
}

/**
 * Resolves and loads the active VS Code theme JSON object
 */
export function getActiveThemeJson(): any | null {
  try {
    // Prioritize activeColorTheme name, then config
    const workbenchConfig = vscode.workspace.getConfiguration('workbench');
    const colorThemeName =
      vscode.window.activeColorTheme?.name ||
      workbenchConfig.get<string>('colorTheme') ||
      'Dark Modern';

    // 1. Search in all VS Code extensions (user installed & built-in)
    for (const extension of vscode.extensions.all) {
      const contributes = extension.packageJSON?.contributes;
      if (contributes?.themes && Array.isArray(contributes.themes)) {
        for (const theme of contributes.themes) {
          const matches =
            theme.label === colorThemeName ||
            theme.id === colorThemeName ||
            (theme.label && colorThemeName.toLowerCase().includes(theme.label.toLowerCase())) ||
            (theme.id && colorThemeName.toLowerCase().includes(theme.id.toLowerCase()));

          if (matches) {
            const themePath = path.join(extension.extensionPath, theme.path);
            const loaded = loadThemeRecursive(themePath);
            if (loaded) {
              loaded.name = colorThemeName;
              return loaded;
            }
          }
        }
      }
    }

    // 2. Common fallback paths for built-in VS Code themes on macOS/Linux/Windows
    const appResourcePaths = [
      '/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/theme-defaults',
      '/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/extensions/theme-defaults',
      process.env.VSCODE_PORTABLE
        ? path.join(process.env.VSCODE_PORTABLE, 'resources/app/extensions/theme-defaults')
        : '',
    ].filter(Boolean);

    for (const resPath of appResourcePaths) {
      if (fs.existsSync(resPath)) {
        const pkgPath = path.join(resPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(stripJsonComments(fs.readFileSync(pkgPath, 'utf8')));
          if (pkg.contributes?.themes) {
            for (const theme of pkg.contributes.themes) {
              const matches =
                theme.label === colorThemeName ||
                theme.id === colorThemeName ||
                (theme.label && colorThemeName.toLowerCase().includes(theme.label.toLowerCase())) ||
                (theme.id && colorThemeName.toLowerCase().includes(theme.id.toLowerCase()));

              if (matches) {
                const themePath = path.join(resPath, theme.path);
                const loaded = loadThemeRecursive(themePath);
                if (loaded) {
                  loaded.name = colorThemeName;
                  return loaded;
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error in getActiveThemeJson:', err);
  }

  return null;
}
