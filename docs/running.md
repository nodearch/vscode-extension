# NodeArch Running & Debugging Support

This VS Code extension provides convenient tools for running and debugging NodeArch applications directly from the editor.

## Status Bar Controls

The extension adds two status bar buttons to VS Code for quick access to common operations:

- **Start NodeArch** (▶️): Runs your NodeArch application using `nodearch start`
- **Debug NodeArch** (🐞): Starts the NodeArch application in debug mode

![Status Bar Buttons](../images/status-bar-buttons.png)

## Command Palette Integration

The following commands are available via the VS Code command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **NodeArch: Start Application**: Runs your NodeArch application
- **NodeArch: Start Application in Watch Mode**: Runs with file watching enabled
- **NodeArch: Debug Application**: Starts NodeArch in debug mode

## Terminal Integration

The extension automatically creates a dedicated "NodeArch Terminal" for running commands. This terminal is reused for subsequent operations to keep your workspace clean.

## Debug Configuration

When you first use the extension, it automatically creates a `.vscode/launch.json` file with optimal settings for debugging NodeArch applications. This includes:

- Using the `nodearch` CLI as the runtime executor
- Setting up the integrated terminal for output
- Configuring environment variables

Example debug configuration:

```json
{
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
}
```

## Usage

### Starting Your Application

1. Click the "Start NodeArch" button (▶️) in the status bar
2. The NodeArch terminal will open and execute `nodearch start`

### Starting in Watch Mode

1. Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run "NodeArch: Start Application in Watch Mode"
3. The application will start with file watching enabled (`-w` flag)

### Debugging

1. Click the "Debug NodeArch" button (🐞) in the status bar
2. The VS Code debugger will start
3. You can set breakpoints in your code and use the debug console

Debugging session features:
- Full access to VS Code's debugging features (variables, call stack, etc.)
- Breakpoints work in both TypeScript and JavaScript files
- Debug console for evaluating expressions
