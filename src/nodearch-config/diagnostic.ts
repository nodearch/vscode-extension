import * as vscode from 'vscode';
import { options, IConfigOption } from './options';

let _diagnosticCollection: vscode.DiagnosticCollection;

// Build a lookup map for options by key.
const optionsMap: { [key: string]: IConfigOption } = {};

options.forEach(opt => {
  optionsMap[opt.key] = opt;
});

export default function activate(context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection) {
  _diagnosticCollection = diagnosticCollection;

  // Validate the document on open and on change
  if (vscode.window.activeTextEditor) {
    validateDocument(vscode.window.activeTextEditor.document);
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      validateDocument(event.document);
    })
  );
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => {
      validateDocument(doc);
    })
  );
}

function validateDocument(document: vscode.TextDocument) {
  // Only validate nodearch config files
  if (document.languageId !== 'nodearch') {
    return;
  }

  const diagnostics: vscode.Diagnostic[] = [];
  const lines = document.getText().split(/\r?\n/);

  // Map to track encountered keys (store the range of the first occurrence)
  const encounteredKeys = new Map<string, vscode.Range>();

  // Regular expression to match a valid property line.
  const regex = /^\s*(?<key>[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*)\s*=\s*(?<value>(?:"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?|true|false|null))\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comments and blank lines
    if (/^\s*(#|!).*$/.test(line) || /^\s*$/.test(line)) {
      continue;
    }

    const propertyMatch = line.match(regex);
    if (!propertyMatch || !propertyMatch.groups) {
      const range = new vscode.Range(i, 0, i, line.length);
      const message = "Syntax error: Expected a property in the form 'key = value' using '=' as the separator.";
      const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
      diagnostics.push(diagnostic);
      continue;
    }

    // Extract the key from the match.
    const key = propertyMatch.groups.key;
    // Compute the range of the key in the line for better diagnostics.
    const keyIndex = line.indexOf(key);
    const keyRange = new vscode.Range(i, keyIndex, i, keyIndex + key.length);

    // Check for duplicate keys if the option doesn't allow multiple entries.
    const opt = optionsMap[key];
    // Only check duplicates for keys defined in options and where multiple is not allowed.
    if (opt && opt.multiple !== true) {
      if (encounteredKeys.has(key)) {
        // Mark duplicate error at the current key occurrence.
        const message = `Duplicate key '${key}' is not allowed for this property.`;
        const diagnostic = new vscode.Diagnostic(keyRange, message, vscode.DiagnosticSeverity.Error);
        diagnostics.push(diagnostic);
      } else {
        encounteredKeys.set(key, keyRange);
      }
    }
  }

  _diagnosticCollection.set(document.uri, diagnostics);
}
