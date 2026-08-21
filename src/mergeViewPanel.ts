import * as vscode from 'vscode';
import * as path from 'path';
import { parseConflictDocument } from './conflictParser.js';
import { ExtensionToWebviewMessage, WebviewToExtensionMessage } from './types.js';

export class MergeViewPanel {
  public static currentPanel: MergeViewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _document: vscode.TextDocument;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, document: vscode.TextDocument) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel for this document, reveal it
    if (MergeViewPanel.currentPanel) {
      MergeViewPanel.currentPanel._document = document;
      MergeViewPanel.currentPanel._panel.reveal(column);
      MergeViewPanel.currentPanel._update();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'svcodeMergeView',
      `Merge: ${path.basename(document.fileName)}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist'),
        ],
      }
    );

    MergeViewPanel.currentPanel = new MergeViewPanel(panel, extensionUri, document);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    document: vscode.TextDocument
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._document = document;

    // Set webview HTML
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Listen for messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message: WebviewToExtensionMessage) => {
        switch (message.type) {
          case 'READY': {
            this._sendInitialDocument();
            break;
          }
          case 'SAVE_AND_RESOLVE': {
            await this._handleSaveAndResolve(message.resolvedContent);
            break;
          }
        }
      },
      null,
      this._disposables
    );

    // Listen for external changes to the document
    vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === this._document.uri.toString()) {
          // Re-parse and update webview if not initiated by us
          this._update();
        }
      },
      null,
      this._disposables
    );
  }

  private _sendInitialDocument() {
    const rawText = this._document.getText();
    const parsed = parseConflictDocument(rawText);

    const msg: ExtensionToWebviewMessage = {
      type: 'INIT_DOCUMENT',
      filePath: this._document.fileName,
      fileName: path.basename(this._document.fileName),
      parsed,
    };

    this._panel.webview.postMessage(msg);
  }

  private _update() {
    const rawText = this._document.getText();
    const parsed = parseConflictDocument(rawText);

    const msg: ExtensionToWebviewMessage = {
      type: 'DOCUMENT_UPDATED',
      parsed,
    };

    this._panel.webview.postMessage(msg);
  }

  private async _handleSaveAndResolve(resolvedContent: string) {
    const fullRange = new vscode.Range(
      this._document.positionAt(0),
      this._document.positionAt(this._document.getText().length)
    );

    const edit = new vscode.WorkspaceEdit();
    edit.replace(this._document.uri, fullRange, resolvedContent);

    const applied = await vscode.workspace.applyEdit(edit);
    if (applied) {
      await this._document.save();
      vscode.window.showInformationMessage(
        `✓ Merge conflicts resolved and saved for ${path.basename(this._document.fileName)}`
      );
      this.dispose();
    } else {
      vscode.window.showErrorMessage('Failed to apply resolved changes to the document.');
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>Simple Merge View</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose() {
    MergeViewPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
