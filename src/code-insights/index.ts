import * as vscode from 'vscode';
import activateDiagnostics from './diagnostics';
import activateCodeActions from './code-actions';


export default function activate(context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection) {
  activateDiagnostics(context, diagnosticCollection);
  activateCodeActions(context);
}