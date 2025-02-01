import * as vscode from 'vscode';

let _diagnosticCollection: vscode.DiagnosticCollection;

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip comments and blank lines
    if (/^\s*(#|!).*$/.test(line) || /^\s*$/.test(line)) {
      continue;
    }
    
    const regex = /^\s*(?<key>[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*)\s*=\s*(?<value>(?:"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?|true|false|null))\s*$/;

    // const propertyMatch = line.match(/^(?<key>[^=:\s]+)\s*=\s*(?<value>.*)$/);
    const propertyMatch = line.match(regex);
    if (!propertyMatch) {
      const range = new vscode.Range(i, 0, i, line.length);
      const message = "Syntax error: Expected a property in the form 'key = value' using '=' as the separator.";
      const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
      diagnostics.push(diagnostic);
    }
  }
  
  _diagnosticCollection.set(document.uri, diagnostics);
}
