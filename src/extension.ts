import * as vscode from 'vscode';
import { MergeViewPanel } from './mergeViewPanel.js';
import { parseConflictDocument } from './conflictParser.js';

class MergeConflictCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];
    const text = document.getText();

    if (!text.includes('<<<<<<<')) {
      return codeLenses;
    }

    const parsed = parseConflictDocument(text);
    if (!parsed.hasConflicts) {
      return codeLenses;
    }

    // Add CodeLens above each conflict
    for (const chunk of parsed.chunks) {
      if (chunk.type === 'conflict') {
        const lineIdx = Math.max(0, chunk.startOriginalLine - 1);
        const line = document.lineAt(lineIdx);
        const range = new vscode.Range(line.range.start, line.range.end);

        codeLenses.push(
          new vscode.CodeLens(range, {
            title: `✨ Open Simple Merge View`,
            tooltip: `Open interactive merge resolver for this conflict`,
            command: 'svcode-merge-view.openMergeEditor',
            arguments: [document.uri],
          })
        );
      }
    }

    return codeLenses;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const codeLensProvider = new MergeConflictCodeLensProvider();

  // Register CodeLens for all languages
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ pattern: '**/*' }, codeLensProvider)
  );

  // Status Bar Item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = 'svcode-merge-view.openMergeEditor';
  context.subscriptions.push(statusBarItem);

  const updateStatusBar = (editor?: vscode.TextEditor) => {
    if (!editor || !editor.document) {
      statusBarItem.hide();
      return;
    }

    const text = editor.document.getText();
    if (text.includes('<<<<<<<')) {
      const parsed = parseConflictDocument(text);
      if (parsed.hasConflicts) {
        statusBarItem.text = `$(git-merge) ${parsed.totalConflicts} Conflict${
          parsed.totalConflicts === 1 ? '' : 's'
        } (Open Merge View)`;
        statusBarItem.tooltip = 'Click to resolve conflicts in Simple Merge View';
        statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.warningBackground'
        );
        statusBarItem.show();
        return;
      }
    }

    statusBarItem.hide();
  };

  // Listen to active editor change & text change
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      updateStatusBar(editor);
      codeLensProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (vscode.window.activeTextEditor?.document.uri.toString() === e.document.uri.toString()) {
        updateStatusBar(vscode.window.activeTextEditor);
        codeLensProvider.refresh();
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme(async () => {
      if (MergeViewPanel.currentPanel) {
        await MergeViewPanel.currentPanel.update();
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('workbench.colorTheme')) {
        if (MergeViewPanel.currentPanel) {
          await MergeViewPanel.currentPanel.update();
        }
      }
    })
  );

  // Initial status bar check
  updateStatusBar(vscode.window.activeTextEditor);

  // Register Command to open Simple Merge View
  const openMergeEditorCommand = vscode.commands.registerCommand(
    'svcode-merge-view.openMergeEditor',
    async (uri?: vscode.Uri) => {
      let document: vscode.TextDocument | undefined;

      if (uri) {
        document = await vscode.workspace.openTextDocument(uri);
      } else if (vscode.window.activeTextEditor) {
        document = vscode.window.activeTextEditor.document;
      }

      if (!document) {
        vscode.window.showErrorMessage('No active file found to resolve merge conflicts.');
        return;
      }

      const text = document.getText();
      const parsed = parseConflictDocument(text);

      if (!parsed.hasConflicts) {
        vscode.window.showInformationMessage(
          `No Git merge conflict markers found in ${document.fileName}.`
        );
        return;
      }

      MergeViewPanel.createOrShow(context.extensionUri, document);
    }
  );

  context.subscriptions.push(openMergeEditorCommand);
}

export function deactivate() {
  if (MergeViewPanel.currentPanel) {
    MergeViewPanel.currentPanel.dispose();
  }
}
