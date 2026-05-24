export interface TreeNode {
  id: string;
  name: string;
  code: string;
  children?: TreeNode[];
  isExpanded?: boolean;
  level: number;
}
