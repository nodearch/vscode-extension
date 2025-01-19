import * as vscode from 'vscode';


export class ComponentExplorerProvider implements vscode.TreeDataProvider<NodeArchComponent> {

  private _onDidChangeTreeData: vscode.EventEmitter<NodeArchComponent | undefined | null | void> = 
    new vscode.EventEmitter<NodeArchComponent | undefined | null | void>();
  
  readonly onDidChangeTreeData: vscode.Event<NodeArchComponent | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: NodeArchComponent): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: NodeArchComponent) {
    return [
      new NodeArchComponent('UserHook', 'Hook', vscode.TreeItemCollapsibleState.None),
      new NodeArchComponent('UserController', 'Controller', vscode.TreeItemCollapsibleState.None),
    ];
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
    this.iconPath = new vscode.ThemeIcon('symbol-class');
  }
}