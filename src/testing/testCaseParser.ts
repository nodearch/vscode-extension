import * as vscode from 'vscode';

/**
 * Represents test metadata in our parser
 */
interface TestMetadata {
  description: string;
  suite?: string;  // Name of the suite this test belongs to
}

/**
 * Parse test cases and test suites from file content
 */
export function parseTestCases(
  fileContent: string, 
  fileUri: vscode.Uri, 
  controller: vscode.TestController,
  testDataMap: Map<string, TestMetadata>
): vscode.TestItem[] {
  const testItems: vscode.TestItem[] = [];
  const suiteItems: Map<string, vscode.TestItem> = new Map();
  
  // First pass: find test suites (@Test decorator on classes)
  findTestSuites(fileContent, fileUri, controller, suiteItems, testDataMap);
  
  // Second pass: find test cases (@Case decorator) and associate with suites
  findTestCases(fileContent, fileUri, controller, suiteItems, testItems, testDataMap);
  
  // Add standalone test suites that don't have any test cases yet
  suiteItems.forEach(suite => {
    if (!testItems.includes(suite)) {
      testItems.push(suite);
    }
  });
  
  return testItems;
}

/**
 * Find and parse test suites (@Test decorator)
 */
function findTestSuites(
  fileContent: string,
  fileUri: vscode.Uri,
  controller: vscode.TestController,
  suiteItems: Map<string, vscode.TestItem>,
  testDataMap: Map<string, TestMetadata>
): void {
  // Fixed regex to match @Test() pattern (with empty parentheses)
  const testRegex = /@Test\s*\(\s*\)[\s\n]*(?:export\s+)?class\s+(\w+)/g;
  
  let match;
  while ((match = testRegex.exec(fileContent)) !== null) {
    const [fullMatch, className] = match;
    const lineNumber = getLineNumber(fileContent, match.index);
    
    // Format class name for display (e.g., "UserTest" -> "User Test")
    const suiteName = formatClassName(className);
    
    // Create test item for the suite
    const suiteId = `suite:${fileUri.fsPath}:${lineNumber}`;
    const suiteItem = controller.createTestItem(
      suiteId,
      suiteName,
      fileUri
    );
    
    // Set the range for navigation
    const document = fileContent.split('\n');
    const lineIndex = lineNumber - 1;
    
    if (lineIndex >= 0 && lineIndex < document.length) {
      const lineText = document[lineIndex];
      suiteItem.range = new vscode.Range(
        new vscode.Position(lineIndex, 0),
        new vscode.Position(lineIndex, lineText.length)
      );
    }
    
    // Store the suite in our maps
    suiteItems.set(suiteName, suiteItem); 
    testDataMap.set(suiteId, { description: suiteName });
  }
}

/**
 * Find and parse test cases (@Case decorator)
 */
function findTestCases(
  fileContent: string,
  fileUri: vscode.Uri,
  controller: vscode.TestController,
  suiteItems: Map<string, vscode.TestItem>,
  testItems: vscode.TestItem[],
  testDataMap: Map<string, TestMetadata>
): void {
  // We need to handle several different patterns:
  // 1. @Case() - Empty case decorator
  // 2. @Case('description') or @Case("description") - Case with string description
  // 3. @Case('description', {params}) - Case with string description and parameters
  
  // First find all @Case decorators, then process each one
  const caseDecorators = [...fileContent.matchAll(/@Case\s*\([^)]*\)/g)];
  
  for (const decoratorMatch of caseDecorators) {
    const fullMatch = decoratorMatch[0];
    const decoratorPosition = decoratorMatch.index!;
    const lineNumber = getLineNumber(fileContent, decoratorPosition);
    
    console.log(`Processing decorator at line ${lineNumber}: ${fullMatch}`);
    
    // Extract the description from the decorator
    let description: string | null = null;
    
    // Try to match a string literal within the decorator
    const stringMatch = /['"]([^'"]*)['"]/g.exec(fullMatch);
    if (stringMatch) {
      description = stringMatch[1];
      console.log(`  Found description in quotes: "${description}"`);
    }
    
    // If no string found, it's an empty decorator - find the method name
    if (!description) {
      // Look ahead to find the method this decorator is attached to
      const afterDecorator = fileContent.substring(decoratorPosition + fullMatch.length, decoratorPosition + 500);
      const methodMatch = /(?:async\s+)?(?:function\s+)?(\w+)\s*\(/m.exec(afterDecorator);
      
      if (methodMatch) {
        const methodName = methodMatch[1];
        description = formatFunctionName(methodName);
        console.log(`  No description in decorator, using method name: "${description}"`);
      } else {
        description = `Test at line ${lineNumber}`;
        console.log(`  Could not find method name, using default: "${description}"`);
      }
    }
    
    // Find parent class/suite
    const parentClassName = findParentClassName(fileContent, decoratorPosition);
    const parentItem = parentClassName ? suiteItems.get(parentClassName) : undefined;
    
    // Create a unique test item ID
    const testId = `test:${fileUri.fsPath}:${lineNumber}`;
    const testItem = controller.createTestItem(
      testId,
      description,
      fileUri
    );
    
    // Set the range for navigation
    const document = fileContent.split('\n');
    const lineIndex = lineNumber - 1;
    
    if (lineIndex >= 0 && lineIndex < document.length) {
      const lineText = document[lineIndex];
      testItem.range = new vscode.Range(
        new vscode.Position(lineIndex, 0),
        new vscode.Position(lineIndex, lineText.length)
      );
    }
    
    // Store metadata about the test
    const metadata: TestMetadata = { description };
    if (parentClassName) {
      metadata.suite = parentClassName;
    }
    testDataMap.set(testId, metadata);
    
    // Add test case to its suite or to the root if no suite exists
    if (parentItem) {
      // Add to parent suite
      parentItem.children.add(testItem);
      
      // Make sure the suite is included in testItems
      if (!testItems.includes(parentItem)) {
        testItems.push(parentItem);
      }
    } else {
      // Add as standalone test
      testItems.push(testItem);
    }
  }
}

/**
 * Attempts to find the parent class name for a test case
 */
function findParentClassName(fileContent: string, position: number): string | undefined {
  // Get content before the test case
  const beforeTest = fileContent.substring(0, position);
  
  // Find the nearest class declaration with @Test above the current position
  const classMatches = [...beforeTest.matchAll(/@Test\s*\(\s*\)[\s\n]*(?:export\s+)?class\s+(\w+)/g)];
  
  if (classMatches.length > 0) {
    const lastClassMatch = classMatches[classMatches.length - 1];
    const className = lastClassMatch[1];
    return formatClassName(className);
  }
  
  return undefined;
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
 * Helper to format class names into readable test suite names
 */
export function formatClassName(name: string): string {
  // Extract meaningful parts from class names like "UserTest" -> "User"
  let baseName = name.replace(/Test$/, '');
  
  // Convert camelCase or PascalCase to space-separated words
  // e.g., "UserController" -> "User Controller"
  let formattedName = baseName.replace(/([A-Z])/g, ' $1').trim();
  
  return formattedName;
}

/**
 * Helper to get line number from character index in text
 */
export function getLineNumber(text: string, index: number): number {
  const textUpToIndex = text.substring(0, index);
  const lines = textUpToIndex.split('\n');
  return lines.length;
}
