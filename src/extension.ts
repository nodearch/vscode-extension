import path from 'node:path';
import * as vscode from 'vscode';
import { NodeArchComponentsProvider } from './views';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const decorationProvider = vscode.window.registerFileDecorationProvider({
		provideFileDecoration(uri) {
			if (path.basename(uri.fsPath) === 'nodearch.json') {
				return {
					// badge: 'N', // Optional: Add a small badge like "N"
					iconPath: vscode.Uri.file(
						path.join(context.extensionPath, 'assets', 'favicon.svg')
					),
					tooltip: 'NodeArch Configuration',
					propagate: false, // Prevent this from affecting other files
					color: undefined, // Default color (can use theme colors)
				};
			}
			return undefined;
		},
	});

	context.subscriptions.push(decorationProvider);

	vscode.window.showInformationMessage(
		'NodeArch project detected. NodeArch Extension is ready to use!'
	);

	const createHookCommand = vscode.commands.registerCommand(
		'nodearch.createHook',
		async () => {
			const hookName = await vscode.window.showInputBox({
				prompt: 'Enter the name of the hook',
				placeHolder: 'Example: user-auth-hook',
			});

			if (hookName) {
				const workspaceFolders = vscode.workspace.workspaceFolders;

				if (workspaceFolders) {
					const selectedPath = await vscode.window.showInputBox({
						prompt: 'Enter the path where the file should be created',
						value: workspaceFolders[0].uri.fsPath,
						placeHolder: 'Example: ./src/hooks',
					});

					if (selectedPath) {
						const filePath = vscode.Uri.file(`${selectedPath}/${hookName}.js`);

						const hookTemplate = `module.exports = {
  hook: '${hookName}',
  method: async function(ctx, next) {
    // Add your code here
    await next();
  }
};`;

						try {
							await vscode.workspace.fs.writeFile(filePath, Buffer.from(hookTemplate, 'utf8'));
							vscode.window.showInformationMessage(`Hook file '${hookName}.js' created successfully at ${selectedPath}!`);

							// Optionally open the file in the editor
							const document = await vscode.workspace.openTextDocument(filePath);
							await vscode.window.showTextDocument(document);
						} catch (error: any) {
							vscode.window.showErrorMessage(`Failed to create hook file: ${error.message}`);
						}
					} else {
						vscode.window.showErrorMessage('No path selected for file creation.');
					}
				} else {
					vscode.window.showErrorMessage('No workspace folder is open.');
				}
			}
		}
	);

	context.subscriptions.push(createHookCommand);

	// const rootPath =
	// 	vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
	// 		? vscode.workspace.workspaceFolders[0].uri.fsPath
	// 		: undefined;

	const nodeArchComponentProvider = new NodeArchComponentsProvider();

	vscode.commands.registerCommand('nodearchComponents.refreshEntry', () =>
    nodeArchComponentProvider.refresh()
  );

	// https://code.visualstudio.com/api/extension-guides/tree-view

	vscode.window.registerTreeDataProvider(
		'nodearchComponents',
		nodeArchComponentProvider
	);

	// vscode.window.createTreeView('nodeArchView', {
	// 	treeDataProvider: new NodeArchComponentsProvider()
	// });

}

// This method is called when your extension is deactivated
export function deactivate() { }
