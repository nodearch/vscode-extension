import * as vscode from 'vscode';
import { IConfigOption, options } from './options';

export default function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: 'nodearch', scheme: 'file' },
      {
        provideCompletionItems(document, position, token, completionContext) {
          // Get the current line text and determine the range of the current "word" (including dots)
          const line = document.lineAt(position);
          // This regex matches letters, digits, underscore, dollar sign, and dot
          const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z0-9_$\.]+/) 
            || new vscode.Range(position, position);

          // Only offer key completions if we haven't started the value part (i.e. before an '=' sign)
          const linePrefix = line.text.substring(0, position.character);
          if (linePrefix.includes('=')) {
            return undefined;
          }

          // Exclude options that have already been set in the document
          const usedKeys = new Set<string>();
          const keyRegex = /[A-Za-z0-9_$\.]+/g;
          let match: RegExpExecArray | null;

          while ((match = keyRegex.exec(document.getText()))) {
            usedKeys.add(match[0]);
          }

          // Filter out options that have already been set
          const filteredOptions = options.filter((option) => option.multiple || !usedKeys.has(option.key));

          // If there are no completions to offer, return undefined
          if (filteredOptions.length === 0) {
            return undefined;
          }
          
          // Create completion items for each valid key
          const completions: vscode.CompletionItem[] = filteredOptions.map((option) => {
            const item = new vscode.CompletionItem(option.key, vscode.CompletionItemKind.Property);
            
            item.insertText = formatOptionStr(option);
              
            item.range = wordRange;

            // item.filterText = option.default ? `${option.key}=${option.default}` : option.key + '=';
            // Optionally, set filterText so VS Code can filter suggestions by what was already typed
            item.filterText = option.key;
            // item.detail = "Nodearch config key";
            item.detail = option.description;
            
            return item;
          });

          return completions;
        }
      },
      // Trigger completions on dot and optionally other characters
      '.',
      ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    )
  );
}


function formatOptionStr(option: IConfigOption) {
  const formattedDefault = option.type === 'string' ? `"${option.default || ''}"` : option.default;

  return option.key + '=' + (formattedDefault || '');
}