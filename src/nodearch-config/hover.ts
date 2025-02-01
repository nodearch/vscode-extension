import * as vscode from 'vscode';

// Dictionary mapping keys to their hover hints
const keyHints: { [key: string]: string } = {
  'server.host': 'The host of your server, e.g. `localhost` or an IP address.',
  'server.port': 'The port on which your server listens (e.g. `3000`).',
  'database.username': 'The username for the database connection.',
  'database.password': 'The password for the database connection.',
  'logging.level': 'The logging level: `debug`, `info`, `warn`, or `error`.'
};

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
          const hint = keyHints[word];
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
