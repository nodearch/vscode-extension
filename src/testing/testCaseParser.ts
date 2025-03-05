import * as vscode from 'vscode';

/**
 * Parse test cases from file content
 */
export function parseTestCases(
  fileContent: string, 
  fileUri: vscode.Uri, 
  controller: vscode.TestController,
  testDataMap: Map<string, { description: string }>
): vscode.TestItem[] {
  const testItems: vscode.TestItem[] = [];
  
  // Simplified regex to find any @Case decorator regardless of its exact format
  const caseRegex = /@Case\s*\(/g;
  let match;
  
  while ((match = caseRegex.exec(fileContent)) !== null) {
    const index = match.index;
    const lineNumber = getLineNumber(fileContent, index);
    
    // Extract the context around the decorator
    const startIdx = fileContent.lastIndexOf('\n', index) + 1;
    const endIdx = fileContent.indexOf('\n', index + 20);
    const contextLines = fileContent.substring(startIdx, endIdx !== -1 ? endIdx : undefined);
    
    // Try to find description in quotes
    const descMatch = /@Case\s*\(\s*["']([^"']*)["']/.exec(contextLines);
    
    // Try to find method/function name
    const subsequentText = fileContent.substring(index + 6, index + 300);
    const methodPattern = /(?:^|\n)\s*(?:async\s+)?(?:function\s+|(?:public|private|protected)\s+)?(\w+)\s*\(/;
    const nameMatch = methodPattern.exec(subsequentText);
    
    let description = '';
    if (descMatch && descMatch[1]) {
      description = descMatch[1];
    } else if (nameMatch && nameMatch[1]) {
      // Make sure we're not capturing keywords like "const"
      const capturedName = nameMatch[1];
      if (!['const', 'let', 'var', 'function', 'class', 'interface', 'type'].includes(capturedName)) {
        description = formatFunctionName(capturedName);
      } else {
        description = `Test case at line ${lineNumber}`;
      }
    } else {
      description = `Test case at line ${lineNumber}`;
    }
    
    const testId = `test:${fileUri.fsPath}:${lineNumber}`;
    const testItem = controller.createTestItem(
      testId,
      description,
      fileUri
    );
    
    // Set the range property for navigation
    const document = fileContent.split('\n');
    const lineIndex = lineNumber - 1;
    
    if (lineIndex >= 0 && lineIndex < document.length) {
      const lineText = document[lineIndex];
      testItem.range = new vscode.Range(
        new vscode.Position(lineIndex, 0),
        new vscode.Position(lineIndex, lineText.length)
      );
    }
    
    testDataMap.set(testId, { description });
    testItems.push(testItem);
  }
  
  return testItems;
}

/**
 * Helper to format function/method names into readable test descriptions
 */
export function formatFunctionName(name: string): string {
  // Convert camelCase to space-separated words and capitalize first letter
  // e.g., "getUsers" -> "Get Users"
  let formattedName = name.replace(/([A-Z])/g, ' $1').trim();
  return formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
}

/**
 * Helper to get line number from character index in text
 */
export function getLineNumber(text: string, index: number): number {
  const textUpToIndex = text.substring(0, index);
  const lines = textUpToIndex.split('\n');
  return lines.length;
}
