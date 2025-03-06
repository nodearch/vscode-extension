import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export default function activate(context: vscode.ExtensionContext) {
  ensureLaunchConfig();

  let startCommand = vscode.commands.registerCommand('nodearch.start', async () => {
    const terminal = getOrCreateTerminal();
    terminal.sendText('nodearch start');
  });

  let startWatchCommand = vscode.commands.registerCommand('nodearch.startWatch', async () => {
    const terminal = getOrCreateTerminal();
    terminal.sendText('nodearch start -w');
  });

  let debugCommand = vscode.commands.registerCommand('nodearch.debug', async () => {
    await startDebugging();
  });

  const startStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  startStatusBarItem.command = 'nodearch.start';
  startStatusBarItem.text = '$(play) Start NodeArch';
  startStatusBarItem.tooltip = 'Run NodeArch Project';
  startStatusBarItem.show();

  const debugStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  debugStatusBarItem.command = 'nodearch.debug';
  debugStatusBarItem.text = '$(bug) Debug NodeArch';
  debugStatusBarItem.tooltip = 'Start Debugging NodeArch Project';
  debugStatusBarItem.show();

  context.subscriptions.push(
    startCommand,
    startWatchCommand,
    startStatusBarItem,
    debugStatusBarItem,
    debugCommand
  );
}

function getOrCreateTerminal(): vscode.Terminal {
  const terminalName = 'NodeArch Terminal';

  let terminal = vscode.window.terminals.find(t => t.name === terminalName);

  if (!terminal) {
    terminal = vscode.window.createTerminal(terminalName);
  }

  terminal.show();

  return terminal;
}

async function ensureLaunchConfig() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  const launchJsonPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'launch.json');
  if (!fs.existsSync(launchJsonPath)) {
    fs.mkdirSync(path.dirname(launchJsonPath), { recursive: true });
    fs.writeFileSync(launchJsonPath, JSON.stringify(debugConfig, null, 4));
  }
}

async function startDebugging() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder found.');
    return;
  }

  const success = await vscode.debug.startDebugging(workspaceFolder, debugConfig.configurations[0]);
  if (!success) {
    vscode.window.showErrorMessage('Failed to start NodeArch debugging.');
  }
}

const debugConfig = {
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug NodeArch App",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "nodearch",
      "args": [
        "start"
      ],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}",
      "env": {
        "NODE_ENV": "development"
      },
      "outputCapture": "std"
    }
  ]
};