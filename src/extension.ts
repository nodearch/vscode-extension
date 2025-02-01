import path from 'node:path';
import * as vscode from 'vscode';
import * as ts from 'typescript';
import { ComponentExplorerProvider } from './views/component-explorer';
import { registerGenerateCommands } from './generate';
import { ExtensionExplorerProvider } from './views/extension-explorer';
import nodearchConfig from './nodearch-config';


export function activate(context: vscode.ExtensionContext) {
	// Get the root path of the workspace
	const rootPath =
		vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
			? vscode.workspace.workspaceFolders[0].uri.fsPath
			: undefined;


  const diagnosticCollection = vscode.languages.createDiagnosticCollection('nodearch');
  context.subscriptions.push(diagnosticCollection);

  nodearchConfig(context, diagnosticCollection);

	// Register commands that generate files
	registerGenerateCommands(context, rootPath);

	const componentProvider = new ComponentExplorerProvider();
	const extensionProvider = new ExtensionExplorerProvider();

	vscode.commands.registerCommand('nodearchComponents.refreshEntry', () =>
		componentProvider.refresh()
	);

	vscode.window.registerTreeDataProvider(
		'nodearchComponents',
		componentProvider
	);

	vscode.window.registerTreeDataProvider(
		'nodearchExtensions',
		extensionProvider
	);

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.languageId === 'typescript') {
      runDiagnostics(event.document, diagnosticCollection);
    }
  });

  vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.languageId === 'typescript') {
      runDiagnostics(document, diagnosticCollection);
    }
  });

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { scheme: 'file', language: 'typescript' },
      new ControllerCodeActionProvider(),
      { providedCodeActionKinds: ControllerCodeActionProvider.providedCodeActionKinds }
    )
  );

}

// This method is called when your extension is deactivated
export function deactivate() { }

function runDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
  const sourceFile = ts.createSourceFile(
    document.fileName,
    document.getText(),
    ts.ScriptTarget.Latest,
    true
  );

  const diagnostics: vscode.Diagnostic[] = [];
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isClassDeclaration(node)) {
      const hasControllerDecorator = node.modifiers?.some((modifier) => {
        if (modifier.kind === ts.SyntaxKind.Decorator) {
          const decorator = modifier as ts.Decorator;
          const expression = decorator.expression as ts.CallExpression;
          return (
            ts.isIdentifier(expression.expression) &&
            expression.expression.text === 'Controller'
          );
        }
        return false;
      });

      if (hasControllerDecorator) {
        node.members.forEach((member) => {
          if (ts.isMethodDeclaration(member) && !member.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) {
            const methodName = member.name?.getText(sourceFile);
            const start = member.name?.getStart(sourceFile);
            const end = member.name?.getEnd();

            if (methodName && start !== undefined && end !== undefined) {
              const range = new vscode.Range(
                document.positionAt(start),
                document.positionAt(end)
              );

              diagnostics.push({
                range,
                message: `Method '${methodName}' in a @Controller() class should be async.`,
                severity: vscode.DiagnosticSeverity.Error,
                code: 'non-async-method',
                source: 'nodearch',
              });
            }
          }
        });
      }
    }
  });

  collection.set(document.uri, diagnostics);
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

/**
 * TODO: 
 * - Test Runner: Add a command to run NodeArch-specific tests directly from VSCode
 * - Add a command to run specific @Test cases or entire test files.
 * - Integrate with testing frameworks to display pass/fail statuses in the editor.
 * - Highlight untested methods or controllers.
 * - Autocomplete environment variable keys in config.env calls.
 * - Provide a visual graph of how dependencies are wired
 * - Display environment variables (config.env) and their default values.
 * - Highlight missing required environment variables.
 * - Integrate commands directly into VSCode (e.g., nodearch build, nodearch start).
 * - Provide Number of controllers, hooks, services, and tests in the status bar.
 * - Coverage of @Test cases and hooks.
 * - Highlight unused components or services.
 */


// https://dev.to/zirkelc/automatically-recommend-vscode-extensions-540c