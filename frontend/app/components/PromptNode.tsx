"use client";

import { useState } from "react";

export type NodeData = {
  id: string;
  prompt: string;
  response?: string;
  children: string[];
  parentId: string | null;
};

type PromptNodeProps = {
  node: NodeData;
  onAddBranch: (parentId: string) => void;
  onDeleteBranch: (nodeId: string) => void;
  onRenameBranch: (nodeId: string, newPrompt: string) => void;
  onCompare: (nodeId: string) => void;
  onPromptChange: (nodeId: string, newPrompt: string) => void;
};

export default function PromptNode({
  node,
  onAddBranch,
  onDeleteBranch,
  onRenameBranch,
  onCompare,
  onPromptChange,
}: PromptNodeProps) 

{
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(node.prompt);
  const [showControls, setShowControls] = useState(false);

  const handleRename = () => {
    onRenameBranch(node.id, editedPrompt);
    setIsEditing(false);
  };

  return (
    <div 
      className="w-full max-w-3xl"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {isEditing ? (
        <div className="mb-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              className="w-full pl-10 pr-10 py-4 bg-white rounded-full shadow-md focus:outline-none text-gray-700"
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              placeholder="Search or ask a question..."
              autoFocus
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                className="bg-blue-500 text-white p-1 rounded-full"
                onClick={handleRename}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              className="w-full pl-10 py-4 bg-white rounded-lg shadow-md focus:outline-none text-gray-700"
              value={node.prompt}
              onChange={(e) => onPromptChange(node.id, e.target.value)}
              placeholder="Search or ask a question..."
            />
          </div>
        </div>
      )}

      {node.response && (
        <div className="bg-white bg-opacity-80 p-4 rounded-lg shadow-sm mt-4">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{node.response}</p>
        </div>
      )}

      <div className="mt-4 flex justify-between items-center">
        <button
          className="text-blue-700 px-3 py-1 text-sm flex items-center hover:text-blue-800"
          onClick={() => onAddBranch(node.id)}
        >
          + Branch
        </button>

        {showControls && (
          <div className="flex space-x-2">
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditing(true)}
              title="Rename branch"
            >
              ✏️
            </button>
            <button
              className="text-gray-500 hover:text-red-500"
              onClick={() => onDeleteBranch(node.id)}
              title="Delete branch"
            >
              🗑️
            </button>
            <button
              className="text-gray-500 hover:text-blue-500"
              onClick={() => onCompare(node.id)}
              title="Compare branches"
            >
              🔀
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
