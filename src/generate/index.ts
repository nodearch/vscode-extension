import * as vscode from 'vscode';
import createHook from './generate-hook';

export function registerGenerateCommands(context: vscode.ExtensionContext, rootPath?: string) {

  const commands = [
    createHook(rootPath)
  ];

  for (const command of commands) {
    context.subscriptions.push(vscode.commands.registerCommand(command.name, command.cb));
  }
  
}