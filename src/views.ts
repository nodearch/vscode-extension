import * as vscode from 'vscode';

export class NodeArchComponentsProvider implements vscode.TreeDataProvider<NodeArchComponent> {
  // constructor(private workspaceRoot: string) {}

  private _onDidChangeTreeData: vscode.EventEmitter<NodeArchComponent | undefined | null | void> = 
    new vscode.EventEmitter<NodeArchComponent | undefined | null | void>();
  
  readonly onDidChangeTreeData: vscode.Event<NodeArchComponent | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: NodeArchComponent): vscode.TreeItem {
    return element;
  }

  getChildren(element?: NodeArchComponent): Thenable<NodeArchComponent[]> {

    return Promise.resolve([
      new NodeArchComponent('UserHook', 'Hook', vscode.TreeItemCollapsibleState.None),
      new NodeArchComponent('UserController', 'Controller', vscode.TreeItemCollapsibleState.None),
    ]);

    // vscode.window.showInformationMessage('Workspace has no package.json');

    // if (!this.workspaceRoot) {
    //   vscode.window.showInformationMessage('No dependency in empty workspace');
    //   return Promise.resolve([]);
    // }
  }

}

class NodeArchComponent extends vscode.TreeItem {
  constructor(
    componentName: string,
    componentType: string,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(componentName, collapsibleState);
    this.tooltip = `@${componentType}() ${componentName}`;
    this.description = `@${componentType}()`;
  }

  // iconPath = {
  //   light: new vscode.ThemeIcon('library'),
  //   dark: new vscode.ThemeIcon('library'),
  // };
}