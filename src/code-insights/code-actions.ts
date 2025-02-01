import * as vscode from 'vscode';


export default function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { scheme: 'file', language: 'typescript' },
      new ControllerCodeActionProvider(),
      { providedCodeActionKinds: ControllerCodeActionProvider.providedCodeActionKinds }
    )
  );
}

class ControllerCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    const diagnostics = context.diagnostics.filter((d) => d.code === 'non-async-method');

    return diagnostics.map((diagnostic) => {
      const fix = new vscode.CodeAction(
        `Make method async`,
        vscode.CodeActionKind.QuickFix
      );

      fix.edit = new vscode.WorkspaceEdit();
      const line = diagnostic.range.start.line;
      const lineText = document.lineAt(line).text;

			const firstNonSpaceIndex = lineText.search(/\S/);

			fix.edit.insert(
				document.uri,
				new vscode.Position(line, firstNonSpaceIndex),
				'async '
			);

      fix.diagnostics = [diagnostic];
      return fix;
    });
  }
}