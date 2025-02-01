import * as vscode from 'vscode';
import { options } from './options';

export default function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: 'nodearch', scheme: 'file' },
      {
        provideHover(document, position, token) {
          // Get the word (key) under the cursor.
          const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z0-9_$\.]+/);
          if (!wordRange) {
            return;
          }
          const word = document.getText(wordRange);

          // Check if this key has an associated hint
          const hint = options.find((option) => option.key === word)?.description;
          
          if (!hint) {
            return;
          }

          // Return a Hover with the hint as Markdown
          return new vscode.Hover(new vscode.MarkdownString(hint), wordRange);
        }
      }
    )
  );
}
