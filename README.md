# Simple Merge View 🔀⚡

Eine schlanke, intuitive 3-Pane Merge-Konflikt-Lösung für VS Code mit zeilenweiser Auswahl und Live-Vorschau.

---

## Warum Simple Merge View?

Die standardmäßige 3-Wege-Merge-Ansicht in VS Code ist oft überladen und unübersichtlich. **Simple Merge View** bietet eine aufgeräumte, klare Benutzeroberfläche mit:

1. **Intuitives 3-Pane-Layout**:
   - **Oben Links**: Current Branch (`HEAD` / Unsere Änderungen)
   - **Oben Rechts**: Incoming Branch (Ziel-Branch / Fremde Änderungen)
   - **Unten**: Live Output / Result Editor (Echtzeit-Vorschau & manuell editierbar)
2. **Zeilenweise Checkboxes**: Jede einzelne Zeile in einem Konfliktblock kann per Klick ausgewählt und in das Ergebnis übernommen werden.
3. **Block-Aktionen**: Ganze Blöcke mit 1 Klick übernehmen (*Take Current*, *Take Incoming*, *Both (Current first)*, *Both (Incoming first)*).
4. **Wort-Level Diff Highlighting**: Direkte optische Hervorhebung geänderter Wörter in den Konfliktzeilen.
5. **Konflikt-Navigation**: Schnelles Springen mit `< Vorheriger` / `Nächster >` Buttons oder Tastatur-Shortcuts.
6. **Echtzeit-Vorschau & Direct-Edit**: Sieh sofort das resultierende Dokument oder wechsle in den *Direct Edit*-Modus, um manuellen Feinschliff vorzunehmen.

---

## Screenshots / Layout

```text
+-----------------------------------------------------------------------------+
| Simple Merge  [sample.ts]   ⚠️ 2 of 3 Unresolved   [< Conflict 1 of 3 >]     |
| [Take All Current]  [Take All Incoming]  [Reset]        [💾 Save & Resolve] |
+-----------------------------------------------------------------------------+
| CURRENT CHANGE (HEAD)                     | INCOMING CHANGE (feature/ui)    |
| [x] 12: const theme = "dark";             | [ ] 12: const theme = "light";  |
| [x] 13: const enableAnimations = true;    | [x] 13: const enableAnimations = false;
+-----------------------------------------------------------------------------+
| ⬍ (Ziehbarer Splitter)                                                      |
+-----------------------------------------------------------------------------+
| RESULT OUTPUT (14 lines)    [✓ All resolved]    [📋 Copy] [👁 Live] [✏ Edit] |
| 12: const theme = "dark";                                                   |
| 13: const enableAnimations = false;                                         |
+-----------------------------------------------------------------------------+
```

---

## Benutzung

### 1. Konflikt-Datei öffnen
Sobald eine Datei mit Git-Merge-Konflikten (`<<<<<<<`, `=======`, `>>>>>>>`) in VS Code geöffnet wird, erscheint:
- Ein **CodeLens-Button** direkt über jedem Konflikt: `✨ Open Simple Merge View`
- Ein **Statusleisten-Eintrag** unten rechts: `$(git-merge) X Conflicts (Open Merge View)`
- Ein **Editor-Action-Icon** oben rechts in der Editor-Titelleiste.

### 2. Tastatur-Shortcuts

| Shortcut | Aktion |
|---|---|
| `Cmd+Alt+M` (Mac) / `Ctrl+Alt+M` (Windows/Linux) | Simple Merge View für die aktuelle Datei öffnen |
| `Alt+[` oder `Alt+P` | Zum vorherigen Konflikt springen |
| `Alt+]` oder `Alt+N` | Zum nächsten Konflikt springen |
| `Cmd+S` / `Ctrl+S` | Speichern & Konflikte auflösen (*Save & Resolve*) |

---

## Entwicklung & Testen in VS Code

1. **Repository in VS Code öffnen**:
   ```bash
   code /Users/rico/Projects/vscode-merge-view
   ```
2. **Build / Watch starten**:
   ```bash
   npm run build   # Einmalig bauen
   npm run watch   # Im Hintergrund bei Code-Änderungen neu bauen
   ```
3. **Erweiterung starten**:
   - Drücke `F5` in VS Code, um ein neues **Extension Development Host** Fenster zu starten.
   - Öffne eine Datei mit Konfliktmarkern (z. B. [`examples/sample-conflict.ts`](file:///Users/rico/Projects/vscode-merge-view/examples/sample-conflict.ts)).
   - Klicke auf `✨ Open Simple Merge View`.

---

## Tests ausführen

```bash
npm test
```
Führt alle Unit- und Integrations-Tests für Parser, Word-Diffs und Merge-Engine mit `vitest` aus.
