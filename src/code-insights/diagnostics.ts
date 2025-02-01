import * as vscode from 'vscode';
import ts from 'typescript';


export default function activate(context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection) {
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'typescript') {
        runDiagnostics(event.document, diagnosticCollection);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === 'typescript') {
        runDiagnostics(document, diagnosticCollection);
      }
    })
  );
}

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