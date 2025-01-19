import * as vscode from 'vscode';


export class ExtensionExplorerProvider implements vscode.TreeDataProvider<NodeArchExtension> {

  private _onDidChangeTreeData: vscode.EventEmitter<NodeArchExtension | undefined | null | void> = 
    new vscode.EventEmitter<NodeArchExtension | undefined | null | void>();
  
  readonly onDidChangeTreeData: vscode.Event<NodeArchExtension | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: NodeArchExtension): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: NodeArchExtension) {
    return [
      new NodeArchExtension('@nodearch/express', 'v2.0.1', vscode.TreeItemCollapsibleState.None),
      new NodeArchExtension('@nodearch/socket.io', 'v2.1.0', vscode.TreeItemCollapsibleState.None),
    ];
  }

}

class NodeArchExtension extends vscode.TreeItem {
  constructor(
    extName: string,
    version: string,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(extName, collapsibleState);
    this.tooltip = extName;
    this.description = version;
    this.iconPath = new vscode.ThemeIcon('extensions');
  }
}