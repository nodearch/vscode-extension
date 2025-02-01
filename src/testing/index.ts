import * as vscode from 'vscode';

export default function activate(context: vscode.ExtensionContext) {
  // Create a Test Controller with a unique ID and a display label.
  const controller = vscode.tests.createTestController('nodearchTests', 'Nodearch Tests');
  context.subscriptions.push(controller);

  // Discover or define your test cases.
  // For example, here we're manually creating two test items.
  // In a real-world scenario, you might read your test cases from files.
  const testItem1 = controller.createTestItem('test1', 'Validate Config Syntax', vscode.Uri.file(''));
  const testItem2 = controller.createTestItem('test2', 'Check Duplicate Keys', vscode.Uri.file(''));
  
  // Optionally, you can organize tests into a hierarchy by using testItem.children.add(…)
  controller.items.add(testItem1);
  controller.items.add(testItem2);

  // Create a Run Profile for "Run" (and optionally one for "Debug")
  controller.createRunProfile(
    'Run',
    vscode.TestRunProfileKind.Run,
    async (request, token) => {
      // Create a new test run instance.
      const run = controller.createTestRun(request);

      // You can iterate over the tests included in the request.
      // For simplicity, we mark each test as enqueued, started, and then passed.
      for (const test of request.include ?? []) {
        run.enqueued(test);
        run.started(test);
        // Here you would run the actual test logic.
        // In this example, we'll simulate a passing test.
        run.passed(test, new Date().getTime());
      }

      run.end();
    },
    true // This profile is the default run profile.
  );

  // Optionally, create a Debug run profile in a similar manner:
  controller.createRunProfile(
    'Debug',
    vscode.TestRunProfileKind.Debug,
    async (request, token) => {
      const run = controller.createTestRun(request);
      for (const test of request.include ?? []) {
        run.enqueued(test);
        run.started(test);
        // Insert debugging logic here. For now, simulate a passing test.
        run.passed(test, new Date().getTime());
      }
      run.end();
    },
    true
  );
}