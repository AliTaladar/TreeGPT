"use client";

import { NodeData } from "./PromptNode";

type TreeSidebarProps = {
  nodes: Record<string, NodeData>;
  rootId: string;
  currentNodeId: string;
  onNodeSelect: (nodeId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

type TreeNodeProps = {
  nodeId: string;
  nodes: Record<string, NodeData>;
  level: number;
  currentNodeId: string;
  onNodeSelect: (nodeId: string) => void;
};

function TreeNode({ nodeId, nodes, level, currentNodeId, onNodeSelect }: TreeNodeProps) {
  const node = nodes[nodeId];
  if (!node) return null;

  const isCurrentNode = currentNodeId === nodeId;
  const promptPreview = node.prompt.length > 25 
    ? node.prompt.substring(0, 25) + "..." 
    : node.prompt;

  return (
    <div className="mb-1">
      <div 
        className={`
          flex items-center pl-${level * 4} py-1 text-sm rounded cursor-pointer
          ${isCurrentNode ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}
        `}
        onClick={() => onNodeSelect(nodeId)}
      >
        <span className="mr-2">•</span>
        <span className="truncate">{promptPreview || "Untitled prompt"}</span>
      </div>
      
      {node.children.map(childId => (
        <TreeNode
          key={childId}
          nodeId={childId}
          nodes={nodes}
          level={level + 1}
          currentNodeId={currentNodeId}
          onNodeSelect={onNodeSelect}
        />
      ))}
    </div>
  );
}

export default function TreeSidebar({
  nodes,
  rootId,
  currentNodeId,
  onNodeSelect,
  isCollapsed,
  onToggleCollapse,
}: TreeSidebarProps) {
  if (isCollapsed) {
    return (
      <div className="w-10 border-r border-gray-200 h-full flex flex-col items-center py-4">
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={onToggleCollapse}
          title="Expand tree"
        >
          →
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-64 border-r border-gray-200 h-full overflow-y-auto">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="font-medium text-sm">TreeGPT</h2>
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={onToggleCollapse}
          title="Collapse tree"
        >
          ←
        </button>
      </div>
      <div className="p-2">
        <TreeNode
          nodeId={rootId}
          nodes={nodes}
          level={0}
          currentNodeId={currentNodeId}
          onNodeSelect={onNodeSelect}
        />
      </div>
    </div>
  );
} 