"use client";

import React, { useState, useRef, useEffect, MouseEvent, WheelEvent } from "react";
import { NodeData } from "./PromptNode";

type TreeVisualizationProps = {
  nodes: Record<string, NodeData>;
  rootId: string;
  currentNodeId: string;
  onNodeSelect: (nodeId: string) => void;
  onClose: () => void;
  onAddBranch: (parentId: string) => void;
  onDeleteBranch: (nodeId: string) => void;
  onRenameBranch: (nodeId: string, newPrompt: string) => void;
};

type NodePosition = {
  x: number;
  y: number;
};

export default function TreeVisualization({
  nodes,
  rootId,
  currentNodeId,
  onNodeSelect,
  onClose,
  onAddBranch,
  onDeleteBranch,
  onRenameBranch,
}: TreeVisualizationProps) {
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredPath, setHoveredPath] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Pan and zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Calculate node positions in a tree layout
  useEffect(() => {
    const calculatePositions = () => {
      const newPositions: Record<string, NodePosition> = {};
      const horizontalSpacing = 150; // now represents vertical distance between levels
      const verticalSpacing = 250; // now represents horizontal distance between nodes
      
      // Helper function to calculate positions recursively
      const calculateNodePosition = (
        nodeId: string,
        level: number,
        index: number,
        totalNodes: number
      ): void => {
        const node = nodes[nodeId];
        if (!node) return;
        
        // For vertical tree, swap the logic:
        // y position is based on level (depth) - was x in horizontal layout
        // x position is based on index (siblings) - was y in horizontal layout
        
        // Calculate y position based on level (top to bottom)
        const y = level * horizontalSpacing + 150; // Increased initial vertical offset
        
        // Calculate x position to center children horizontally
        let x;
        if (node.children.length === 0) {
          // Leaf node, position based on index
          x = index * verticalSpacing + 100;
        } else {
          // Internal node, position based on average of children
          const firstChildIndex = index;
          const lastChildIndex = index + totalNodes - 1;
          x = ((firstChildIndex + lastChildIndex) / 2) * verticalSpacing + 100;
        }
        
        newPositions[nodeId] = { x, y };
        
        // Calculate positions for children
        let childIndex = index;
        node.children.forEach(childId => {
          const childSize = calculateTreeSize(childId);
          calculateNodePosition(childId, level + 1, childIndex, childSize);
          childIndex += childSize;
        });
      };
      
      // Helper to calculate the size of a subtree (number of leaf nodes)
      const calculateTreeSize = (nodeId: string): number => {
        const node = nodes[nodeId];
        if (!node) return 0;
        if (node.children.length === 0) return 1;
        
        return node.children.reduce(
          (sum, childId) => sum + calculateTreeSize(childId),
          0
        );
      };
      
      const rootSize = calculateTreeSize(rootId);
      calculateNodePosition(rootId, 0, 0, rootSize);
      
      setPositions(newPositions);
    };
    
    calculatePositions();
  }, [nodes, rootId]);
  
  // Set initial pan to center the root node
  useEffect(() => {
    if (positions[rootId] && svgRef.current) {
      const rootPos = positions[rootId];
      const svgRect = svgRef.current.getBoundingClientRect();
      
      // Center the root node horizontally
      const centerX = svgRect.width / 2 - rootPos.x - 100;
      const centerY = 50; // Small offset from top
      
      setPan({ x: centerX, y: centerY });
    }
  }, [positions, rootId]);
  
  // Add this function to get ancestors of a node
  const getNodeAncestors = (nodeId: string): string[] => {
    const ancestors: string[] = [];
    let currentId: string | null = nodeId;
    
    while (currentId) {
      ancestors.push(currentId);
      currentId = nodes[currentId]?.parentId || null;
    }
    
    return ancestors;
  };
  
  // Update the mouse handlers to track the path
  const handleMouseEnter = (nodeId: string) => {
    setHoveredNodeId(nodeId);
    setHoveredPath(getNodeAncestors(nodeId));
  };
  
  const handleMouseLeave = () => {
    setHoveredNodeId(null);
    setHoveredPath([]);
  };
  
  // Draw lines connecting nodes
  const renderLines = () => {
    const lines: React.ReactNode[] = [];
    
    Object.values(nodes).forEach(node => {
      if (!node.parentId) return;
      
      const parentPos = positions[node.parentId];
      const childPos = positions[node.id];
      
      if (parentPos && childPos) {
        // Check if this line is part of the hovered path
        const isInPath = hoveredPath.includes(node.id) && hoveredPath.includes(node.parentId);
        
        lines.push(
          <line
            key={`line-${node.parentId}-${node.id}`}
            // For vertical tree: line goes from bottom of parent to top of child
            x1={parentPos.x + 100} // middle of parent horizontally
            y1={parentPos.y + 100} // bottom of parent
            x2={childPos.x + 100} // middle of child horizontally
            y2={childPos.y} // top of child
            stroke={isInPath ? "#78c288" : "#CBD5E0"}
            strokeWidth={isInPath ? "3" : "2"}
            opacity={isInPath ? "1" : "0.6"}
          />
        );
      }
    });
    
    return lines;
  };
  
  const handleRename = (nodeId: string) => {
    setEditingNodeId(nodeId);
    setEditedPrompt(nodes[nodeId]?.prompt || "");
  };
  
  const handleSaveRename = () => {
    if (editingNodeId) {
      onRenameBranch(editingNodeId, editedPrompt);
      setEditingNodeId(null);
    }
  };
  
  // Pan and zoom event handlers
  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    // Only start dragging on the background, not on nodes
    if ((e.target as Element).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  
  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleWheel = (e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    // Calculate new zoom factor (decrease for wheel up, increase for wheel down)
    const newZoom = Math.max(0.5, Math.min(2, zoom - e.deltaY * 0.001));
    // Get the SVG bounding box
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
      // Calc mouse position relative to SVG
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;
      // Adjust pan to zoom into/out of mouse point
      setPan({
        x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - pan.y) * (newZoom / zoom)
      });
    }
    setZoom(newZoom);
  };
  
  // Zoom control buttons
  const handleZoomIn = () => {
    setZoom(Math.min(2, zoom + 0.1));
  };
  
  const handleZoomOut = () => {
    setZoom(Math.max(0.5, zoom - 0.1));
  };
  
  const handleResetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };
  
  return (
    <div className="fixed inset-0 bg-[#fdfcfa] z-50 flex flex-col overflow-hidden">
      {/* Fixed control panel in top-left with highest z-index */}
      <div className="fixed top-4 left-4 z-[100] flex items-center space-x-2 bg-white/90 p-2 rounded-lg shadow-md backdrop-blur-sm">
        <button
          className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
          onClick={handleZoomIn}
          title="Zoom in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
          onClick={handleZoomOut}
          title="Zoom out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
        <button
          className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-100"
          onClick={handleResetView}
          title="Reset view"
        >
          Reset
        </button>
      </div>
      
      {/* Fixed View Chat button with highest z-index */}
      <button
        className="fixed top-4 right-4 z-[100] flex items-center px-3 py-1.5 bg-[#78c288] text-black rounded-full text-sm shadow-md hover:bg-[#68b278] transition-colors"
        onClick={onClose}
      >
        view chat
      </button>
      
      {/* Helper text with highest z-index */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white/90 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm z-[100]">
        Use + and - buttons to zoom
      </div>
      
      <div className="flex-1 overflow-hidden p-0 relative">
        <svg
          ref={svgRef}
          className="absolute min-w-full min-h-full cursor-grab active:cursor-grabbing"
          style={{ 
            width: "100%", 
            height: "100%",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Draw connecting lines between nodes */}
            {renderLines()}
            
            {/* Draw nodes */}
            {Object.values(nodes).map(node => {
              const pos = positions[node.id];
              if (!pos) return null;
              
              const isCurrentNode = node.id === currentNodeId;
              const isHovered = node.id === hoveredNodeId;
              const isInPath = hoveredPath.includes(node.id);
              
              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => onNodeSelect(node.id)}
                  onMouseEnter={() => handleMouseEnter(node.id)}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: "pointer" }}
                >
                  {/* Node background */}
                  <rect
                    x="0"
                    y="0"
                    width="200"
                    height="100"
                    rx="8"
                    ry="8"
                    fill={isCurrentNode ? "rgba(120, 194, 136, 0.15)" : isInPath ? "rgba(120, 194, 136, 0.1)" : "#FFFFFF"}
                    stroke={isCurrentNode ? "#246e3a" : isHovered ? "#78c288" : isInPath ? "#78c288" : "#E2E8F0"}
                    strokeWidth={isCurrentNode ? "3" : isInPath ? "3" : "2"}
                  />
                  
                  {/* Prompt text */}
                  {editingNodeId === node.id ? (
                    <>
                      <foreignObject x="10" y="10" width="180" height="50">
                        <div className="h-full">
                          <input
                            type="text"
                            className="w-full p-1 text-sm border border-[#78c288] rounded focus:outline-none focus:ring-2 focus:ring-[#78c288]"
                            value={editedPrompt}
                            onChange={(e) => setEditedPrompt(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                      </foreignObject>
                      <foreignObject x="10" y="60" width="180" height="30">
                        <div className="flex justify-end">
                          <button
                            className="px-2 py-1 text-xs bg-[#78c288] text-black rounded mr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveRename();
                            }}
                          >
                            Save
                          </button>
                          <button
                            className="px-2 py-1 text-xs bg-gray-200 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingNodeId(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </foreignObject>
                    </>
                  ) : (
                    <>
                      <foreignObject x="10" y="10" width="180" height="65">
                        <div className="overflow-hidden h-full">
                          <p className="text-sm text-gray-700 truncate">
                            {node.prompt || "Root node"}
                          </p>
                        </div>
                      </foreignObject>
                      
                      {/* Node controls (shown on hover) */}
                      {isHovered && (
                        <foreignObject x="10" y="65" width="180" height="30">
                          <div className="flex justify-between items-center">
                            <button
                              className="text-[#78c288] hover:text-[#68b278] text-xs font-bold flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddBranch(node.id);
                              }}
                            >
                              + Branch
                            </button>
                            <div className="flex space-x-2">
                              <button
                                className="text-gray-500 hover:text-gray-700 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRename(node.id);
                                }}
                                title="Rename branch"
                              >
                                ✏️
                              </button>
                              {node.id !== rootId && (
                                <button
                                  className="text-gray-500 hover:text-red-500 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteBranch(node.id);
                                  }}
                                  title="Delete branch"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        </foreignObject>
                      )}
                    </>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
} 