import * as vscode from 'vscode';

// Define a list of valid keys for auto-completion
const validKeys = [
  'server.host',
  'server.port',
  'database.username',
  'database.password',
  'logging.level'
];

export default function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: 'nodearch', scheme: 'file' },
      {
        provideCompletionItems(document, position, token, completionContext) {
          // Get the current line text and determine the range of the current "word" (including dots)
          const line = document.lineAt(position);
          // This regex matches letters, digits, underscore, dollar sign, and dot
          const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z0-9_$\.]+/) 
            || new vscode.Range(position, position);

          // Only offer key completions if we haven't started the value part (i.e. before an '=' sign)
          const linePrefix = line.text.substring(0, position.character);
          if (linePrefix.includes('=')) {
            return undefined;
          }
          
          // Create completion items for each valid key
          const completions: vscode.CompletionItem[] = validKeys.map(key => {
            const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Property);
            // Set a text edit that replaces the current word with the full key
            item.textEdit = vscode.TextEdit.replace(wordRange, key);
            // Optionally, set filterText so VS Code can filter suggestions by what was already typed
            item.filterText = key;
            item.detail = "Nodearch config key";
            return item;
          });

          return completions;
        }
      },
      // Trigger completions on dot and optionally other characters
      '.',
      ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    )
  );
}
