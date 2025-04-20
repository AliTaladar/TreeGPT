"use client";

import { NodeData } from "./PromptNode";

type CompareViewProps = {
  leftNode: NodeData;
  rightNode: NodeData;
  onClose: () => void;
};

function highlightDiff(textA: string, textB: string): { marked: string, added: boolean }[] {
  // Simple word-by-word diff highlighting
  const wordsA = textA.split(/\s+/);
  const wordsB = textB.split(/\s+/);
  const result: { marked: string, added: boolean }[] = [];
  
  const maxLen = Math.max(wordsA.length, wordsB.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < wordsA.length && i < wordsB.length) {
      if (wordsA[i] === wordsB[i]) {
        result.push({ marked: wordsA[i], added: false });
      } else {
        result.push({ marked: wordsB[i], added: true });
      }
    } else if (i < wordsB.length) {
      result.push({ marked: wordsB[i], added: true });
    }
  }

  return result;
}

export default function CompareView({ leftNode, rightNode, onClose }: CompareViewProps) {
  const promptDiff = highlightDiff(leftNode.prompt, rightNode.prompt);
  const responseDiff = highlightDiff(leftNode.response, rightNode.response);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-4/5 h-4/5 flex flex-col">
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-lg font-medium">Compare Branches</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left Column */}
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col h-full">
              <h3 className="text-sm font-medium mb-2">Branch A</h3>
              <div className="bg-gray-50 p-3 mb-4 rounded border border-gray-100">
                <p className="text-sm text-gray-700">{leftNode.prompt}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-100 flex-1">
                <p className="text-sm text-gray-700">{leftNode.response}</p>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col h-full">
              <h3 className="text-sm font-medium mb-2">Branch B</h3>
              <div className="bg-gray-50 p-3 mb-4 rounded border border-gray-100">
                <p className="text-sm">
                  {promptDiff.map((word, i) => (
                    <span 
                      key={i} 
                      className={word.added ? 'bg-green-100 text-green-800' : 'text-gray-700'}
                    >
                      {word.marked}{' '}
                    </span>
                  ))}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-100 flex-1">
                <p className="text-sm">
                  {responseDiff.map((word, i) => (
                    <span 
                      key={i} 
                      className={word.added ? 'bg-green-100 text-green-800' : 'text-gray-700'}
                    >
                      {word.marked}{' '}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 