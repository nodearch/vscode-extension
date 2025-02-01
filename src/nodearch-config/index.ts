import * as vscode from 'vscode';
import hover from './hover';
import diagnostic from './diagnostic';
import autocomplete from './autocomplete';


export default function activate(context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection) {
  autocomplete(context);
  hover(context);
  diagnostic(context, diagnosticCollection);
}