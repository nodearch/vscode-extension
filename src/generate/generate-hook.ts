import * as vscode from 'vscode';

export default function createHook(rootPath?: string) {
  return {
    name: 'nodearch.createHook',
    cb: async () => {

      const hookName = await vscode.window.showInputBox({
        prompt: 'Enter the name of the hook',
        placeHolder: 'Example: user-auth-hook',
      });

      if (hookName) {
        if (rootPath) {
          const selectedPath = await vscode.window.showInputBox({
            prompt: 'Enter the path where the file should be created',
            value: rootPath,
            placeHolder: 'Example: ./src/hooks',
          });

          if (selectedPath) {
            const filePath = vscode.Uri.file(`${selectedPath}/${hookName}.js`);

            const hookTemplate = [
              "import { Hook, IHook } from '@nodearch/core';",
              "",
              "@Hook()",
              "export class ${1:MyHook} implements IHook {",
              "",
              "  constructor() {}",
              "",
              "  async onStart() {",
              "    ${2:// Your logic here}",
              "  }",
              "",
              "  async onStop() {",
              "    ${3:// Cleanup logic here}",
              "  }",
              "",
              "}"
            ].join('\n');

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
  };
}