import path from 'node:path';
import * as vscode from 'vscode';
import { ComponentExplorerProvider } from './views/component-explorer';
import { registerGenerateCommands } from './generate';
import { ExtensionExplorerProvider } from './views/extension-explorer';

export function activate(context: vscode.ExtensionContext) {
	// Get the root path of the workspace
	const rootPath =
		vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
			? vscode.workspace.workspaceFolders[0].uri.fsPath
			: undefined;

	// Register the file decoration for nodearch.json
	context.subscriptions.push(registerFileDecoration());

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

}

// This method is called when your extension is deactivated
export function deactivate() { }

function registerFileDecoration() {
	return vscode.window.registerFileDecorationProvider({
		provideFileDecoration(uri) {
			if (path.basename(uri.fsPath) === 'nodearch.json') {
				return {
					badge: 'N',
					tooltip: 'NodeArch Configuration',
					propagate: false,
					color: undefined
				};
			}
			return undefined;
		},
	});
}
