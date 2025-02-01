import * as vscode from 'vscode';
import { ComponentExplorerProvider } from './views/component-explorer';
import { registerGenerateCommands } from './generate';
import { ExtensionExplorerProvider } from './views/extension-explorer';
import nodearchConfig from './nodearch-config';
import codeInsights from './code-insights';
import testing from './testing';

export function activate(context: vscode.ExtensionContext) {
	// Get the root path of the workspace
	const rootPath =
		vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
			? vscode.workspace.workspaceFolders[0].uri.fsPath
			: undefined;


  const diagnosticCollection = vscode.languages.createDiagnosticCollection('nodearch');
  context.subscriptions.push(diagnosticCollection);

  nodearchConfig(context, diagnosticCollection);
  codeInsights(context, diagnosticCollection);
	testing(context);

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
 * - Debug tab
 * - Tests tab
 */


// https://dev.to/zirkelc/automatically-recommend-vscode-extensions-540c