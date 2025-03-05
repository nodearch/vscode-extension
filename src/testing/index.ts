import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as cp from 'child_process';
import { parseTestCases } from './testCaseParser';

export default function activate(context: vscode.ExtensionContext) {
  // Create a Test Controller with a unique ID and a display label.
  const controller = vscode.tests.createTestController('nodearchTests', 'Nodearch Tests');
  context.subscriptions.push(controller);

  // Create a map to store additional test case data
  const testDataMap = new Map<string, { description: string }>();

  // Function to discover test cases in the workspace
  async function discoverTestCases() {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showWarningMessage('No workspace folders found.');
        return;
      }

      // Clear existing test items
      controller.items.replace([]);

      // Find all TypeScript and JavaScript files
      const filePattern = '**/*.{ts,js}';
      const excludePattern = '**/node_modules/**';
      
      console.log('Looking for test files with pattern:', filePattern);
      const files = await vscode.workspace.findFiles(filePattern, excludePattern);
      console.log(`Found ${files.length} files to scan for tests`);

      for (const fileUri of files) {
        try {
          const fileContent = await fs.readFile(fileUri.fsPath, 'utf-8');
          
          // Only attempt to parse files that contain @Case decorators
          if (fileContent.includes('@Case')) {
            console.log(`Found @Case decorator in ${fileUri.fsPath}`);
            
            // Use the imported parser to find test cases
            const testCases = parseTestCases(fileContent, fileUri, controller, testDataMap);
            console.log(`${testCases.length} test cases found in ${fileUri.fsPath}`);
            
            if (testCases.length > 0) {
              // Create a file-level test item as a parent
              const fileName = path.basename(fileUri.fsPath);
              const fileTestItem = controller.createTestItem(
                `file:${fileUri.fsPath}`,
                fileName,
                fileUri
              );
              
              // Add each test case as a child of the file test item
              testCases.forEach(testCase => {
                fileTestItem.children.add(testCase);
              });
              
              controller.items.add(fileTestItem);
            }
          }
        } catch (error) {
          console.error(`Error processing file ${fileUri.fsPath}:`, error);
        }
      }
    } catch (error) {
      console.error('Error discovering test cases:', error);
    }
  }

  // Set up file watcher to update tests when files change
  const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,js}');
  context.subscriptions.push(
    fileWatcher.onDidChange(discoverTestCases),
    fileWatcher.onDidCreate(discoverTestCases),
    fileWatcher.onDidDelete(discoverTestCases)
  );

  // Initial discovery of test cases
  discoverTestCases();

  // Create a Run Profile for "Run"
  controller.createRunProfile(
    'Run',
    vscode.TestRunProfileKind.Run,
    async (request, token) => {
      const run = controller.createTestRun(request);
      
      // Create a mutable queue of test items to process
      let queue: vscode.TestItem[] = [];
      
      if (request.include) {
        queue = [...request.include];
      } else {
        controller.items.forEach(item => queue.push(item));
      }
      
      const testItems: vscode.TestItem[] = [];
      
      // Flatten the test hierarchy to get all individual test items
      while (queue.length > 0) {
        const item = queue.shift()!;
        if (item.children.size > 0) {
          item.children.forEach(child => queue.push(child));
        } else {
          testItems.push(item);
        }
      }
      
      // Get workspace root for executing commands
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is open to run tests in.');
        run.end();
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      
      // Create or get terminal for test execution
      let terminal: vscode.Terminal | undefined = vscode.window.terminals.find(t => t.name === 'NodeArch Tests');
      if (!terminal) {
        terminal = vscode.window.createTerminal({
          name: 'NodeArch Tests',
          cwd: workspaceRoot
        });
      }
      
      // Execute each test
      for (const test of testItems) {
        if (token.isCancellationRequested) break;
        
        run.enqueued(test);
        run.started(test);
        
        try {
          // Get test description from our map
          const testData = testDataMap.get(test.id);
          const description = testData?.description || test.label;
          
          // Escape quotes in the description for the shell command
          const escapedDescription = description.replace(/"/g, '\\"');
          
          // Run the test using nodearch command
          const cmd = `nodearch test -g "${escapedDescription}"`;
          console.log(`Executing: ${cmd}`);
          
          // Option 1: Run in terminal (visual feedback but harder to capture output)
          // terminal.show();
          // terminal.sendText(cmd);
          
          // Option 2: Run using child_process (better for capturing output)
          const result = await new Promise<{ code: number, output: string }>((resolve, reject) => {
            let output = '';
            
            const proc = cp.exec(cmd, { cwd: workspaceRoot }, (error, stdout, stderr) => {
              output = stdout + '\n' + stderr;
              if (error) {
                resolve({ code: error.code || 1, output });
              } else {
                resolve({ code: 0, output });
              }
            });
            
            // Allow for cancellation
            token.onCancellationRequested(() => {
              proc.kill();
              reject(new Error('Test execution cancelled'));
            });
          });
          
          console.log(`Test execution output for "${description}":`);
          console.log(result.output);
          
          if (result.code === 0) {
            // Test passed
            run.passed(test);
            
            // Add output to the test run's output channel
            if (result.output.trim()) {
              run.appendOutput(`\n--- Output from "${description}" ---\n`);
              run.appendOutput(result.output);
              run.appendOutput('\n--- End of output ---\n\n');
            }
          } else {
            // Test failed - we can attach the error message to the failure
            const message = new vscode.TestMessage(result.output);
            // Create a proper Location object for error messages
            if (test.uri && test.range) {
              message.location = new vscode.Location(test.uri, test.range);
            }
            run.failed(test, message);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error(`Error running test "${test.label}":`, errorMessage);
          const message = new vscode.TestMessage(`Failed to run test: ${errorMessage}`);
          if (test.uri && test.range) {
            message.location = new vscode.Location(test.uri, test.range);
          }
          run.failed(test, message);
        }
      }
      
      run.end();
    },
    true
  );

  // Debug run profile - similar but with debugging configuration
  controller.createRunProfile(
    'Debug',
    vscode.TestRunProfileKind.Debug,
    async (request, token) => {
      const run = controller.createTestRun(request);
      
      // Similar implementation to Run but with --inspect flag
      // ...
      
      run.end();
    },
    true
  );
}