"use client";

import { useState, useCallback, KeyboardEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { NodeData } from "./PromptNode";
import CompareView from "./CompareView";
import TreeVisualization from "./TreeVisualization";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function BranchingPrompts() {
  const [nodes, setNodes] = useState<Record<string, NodeData>>(() => {
    const rootId = uuidv4();
    return {
      [rootId]: {
        id: rootId,
        prompt: "",
        response: "",
        children: [],
        parentId: null,
      },
    };
  });
  
  const [rootId] = useState<string>(() => Object.keys(nodes)[0]);
  const [currentNodeId, setCurrentNodeId] = useState<string>(rootId);
  const [branchedFrom, setBranchedFrom] = useState<{nodeId: string, isAiResponse: boolean} | null>(null);
  const [compareNodes, setCompareNodes] = useState<{
    leftId: string;
    rightId: string;
  } | null>(null);
  const [showTreeVisualization, setShowTreeVisualization] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail] = useState("user@example.com"); // Placeholder for user email

  // Check if conversation has started
  const hasConversation = Object.values(nodes).some(node => node.prompt || node.response);

  // Sample conversation history for sidebar
  const conversationHistory = [
    { id: 1, title: "AI Ethics and Guidelines", date: "Apr 28" },
    { id: 2, title: "The Future of Machine Learning", date: "Apr 26" },
    { id: 3, title: "JavaScript Best Practices", date: "Apr 24" },
    { id: 4, title: "Data Visualization Techniques", date: "Apr 22" },
    { id: 5, title: "Neural Networks Explained", date: "Apr 20" },
    { id: 6, title: "Quantum Computing Basics", date: "Apr 18" },
    { id: 7, title: "Climate Change Solutions", date: "Apr 16" },
  ];

  // Improved AI response simulation
  const fetchAIResponse = useCallback(async (prompt: string): Promise<string> => {
    // Simulate API delay
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    
    // Get current date and time for realistic responses
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short'
    };
    const dateTimeStr = now.toLocaleDateString('en-US', options);
    
    // Sample responses based on prompt content
    if (prompt.toLowerCase().includes("time") || prompt.toLowerCase().includes("date")) {
      return `It's ${dateTimeStr}.\n\nRight on the edge of golden hour—perfect time to wrap up the day strong or start something bold 🧠✨`;
    }
    
    const responses = [
      "I understand your question about \"${prompt}\". Based on my knowledge, this involves several key factors that we should consider...",
      "That's an interesting query about \"${prompt}\". Let me provide some insights that might help you...",
      "When it comes to \"${prompt}\", there are multiple perspectives to consider. First, let's examine the fundamental concepts...",
      "\"${prompt}\" is a fascinating topic. From my analysis, I can tell you that experts in this field typically approach this by...",
      "I've processed your question about \"${prompt}\". Here's what I can tell you based on my training data and algorithms..."
    ];
    
    // Pick a random response and substitute the prompt
    const responseTemplate = responses[Math.floor(Math.random() * responses.length)];
    const response = responseTemplate.replace("${prompt}", prompt) + 
      "\n\nFurther analysis would suggest that there are " + Math.floor(Math.random() * 5 + 2) + 
      " key aspects to consider when approaching this. Would you like me to elaborate on any specific aspect?";
    
    return response;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && userInput.trim()) {
      e.preventDefault();
      
      // Create a new node with the current input
      const newNodeId = uuidv4();
      const newNode: NodeData = {
        id: newNodeId,
        prompt: userInput,
        response: "",
        children: [],
        parentId: currentNodeId,
      };
      
      // Update parent node's children array
      const updatedParent = {
        ...nodes[currentNodeId],
        children: [...nodes[currentNodeId].children, newNodeId],
      };
      
      // Add the new node to the state
      setNodes(prev => ({
        ...prev,
        [currentNodeId]: updatedParent,
        [newNodeId]: newNode,
      }));
      
      // Set the new node as the current node
      setCurrentNodeId(newNodeId);
      
      // Clear the input field
      setUserInput("");
      
      // Fetch AI response
      const response = await fetchAIResponse(userInput);
      setNodes(prev => ({
        ...prev,
        [newNodeId]: {
          ...prev[newNodeId],
          response,
        },
      }));
    }
  };

  // Update handleAddBranch to always fetch response immediately
  const handleAddBranch = useCallback(async (parentId: string, isAiResponse = false) => {
    const parentNode = nodes[parentId];
    if (!parentNode) return;

    const newNodeId = uuidv4();
    
    // Create new node with parent's prompt as a starting point
    const newNode: NodeData = {
      id: newNodeId,
      prompt: parentNode.prompt,
      response: "",
      children: [],
      parentId,
    };
    
    // Update parent node's children array
    const updatedParent = {
      ...parentNode,
      children: [...parentNode.children, newNodeId],
    };
    
    // Add the new node to the state
    setNodes(prev => ({
      ...prev,
      [parentId]: updatedParent,
      [newNodeId]: newNode,
    }));
    
    // Set the new node as the current node
    setCurrentNodeId(newNodeId);
    
    // Set the branched from node ID to control display order
    setBranchedFrom({nodeId: parentId, isAiResponse});
    
    // Add visual indication that a new branch was created
    const element = document.getElementById(`node-${newNodeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      element.classList.add('highlight-new-branch');
      setTimeout(() => element.classList.remove('highlight-new-branch'), 2000);
    }
    
    // Always fetch AI response if there's a prompt
    if (newNode.prompt) {
      const response = await fetchAIResponse(newNode.prompt);
      setNodes(prev => ({
        ...prev,
        [newNodeId]: {
          ...prev[newNodeId],
          response,
        },
      }));
    }
  }, [nodes, fetchAIResponse]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteBranch = useCallback((nodeId: string) => {
    const nodeToDelete = nodes[nodeId];
    if (!nodeToDelete || nodeId === rootId) return; // Can't delete root
    
    // Get the parent node
    const parentId = nodeToDelete.parentId;
    if (!parentId) return;
    
    const parentNode = nodes[parentId];
    
    // Create new nodes object without the deleted node and its children
    const updatedNodes = { ...nodes };
    
    // Recursive function to delete a node and all its children
    const deleteNodeAndChildren = (id: string) => {
      const node = updatedNodes[id];
      if (!node) return;
      
      // Delete all children first
      node.children.forEach(childId => {
        deleteNodeAndChildren(childId);
      });
      
      // Delete the node itself
      delete updatedNodes[id];
    };
    
    // Delete the node and its children
    deleteNodeAndChildren(nodeId);
    
    // Update the parent's children array
    updatedNodes[parentId] = {
      ...parentNode,
      children: parentNode.children.filter(id => id !== nodeId),
    };
    
    // Update state
    setNodes(updatedNodes);
    
    // If the current node was deleted, set the parent as the current node
    if (currentNodeId === nodeId || !updatedNodes[currentNodeId]) {
      setCurrentNodeId(parentId);
    }
  }, [nodes, rootId, currentNodeId]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRenameBranch = useCallback((nodeId: string, newPrompt: string) => {
    setNodes(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        prompt: newPrompt,
      },
    }));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCompare = useCallback((nodeId: string) => {
    const currentNode = nodes[nodeId];
    if (!currentNode || !currentNode.parentId) return;
    
    setCompareNodes({
      leftId: currentNode.parentId,
      rightId: nodeId,
    });
  }, [nodes]);

  // Add a function to handle creating a new conversation
  const handleNewConversation = useCallback(() => {
    // Create a new root node
    const newRootId = uuidv4();
    
    // Add the new node to the state
    setNodes(prev => ({
      ...prev,
      [newRootId]: {
        id: newRootId,
        prompt: "",
        response: "",
        children: [],
        parentId: null,
      },
    }));
    
    // Set the new node as the current node
    setCurrentNodeId(newRootId);
    
    // Clear user input
    setUserInput("");
  }, []);

  // Update renderChatHistory to remove special case for editable nodes
  const renderChatHistory = () => {
    const chatItems = [];
    
    // Create a collection of node IDs to display in correct order
    const nodeIdsToDisplay: string[] = [];
    
    // If we're showing a branch from an AI response, only show that response
    if (branchedFrom?.isAiResponse) {
      // Only add the AI response node
      nodeIdsToDisplay.push(branchedFrom.nodeId);
      
      // Add the new branch (current node) that will show response
      nodeIdsToDisplay.push(currentNodeId);
      
      // Reset the branched state after displaying
      setBranchedFrom(null);
    } 
    // If we're showing a branch from a user prompt, show the original context
    else if (branchedFrom) {
      nodeIdsToDisplay.push(branchedFrom.nodeId);
      
      // Then add all ancestors of the branched node
      let ancestorId = nodes[branchedFrom.nodeId]?.parentId;
      while (ancestorId) {
        nodeIdsToDisplay.push(ancestorId);
        ancestorId = nodes[ancestorId]?.parentId;
      }
      
      // Finally add the current node (the new branch)
      nodeIdsToDisplay.push(currentNodeId);
      
      // Reset the branched state after displaying
      setBranchedFrom(null);
    } else {
      // Use the normal traversal up the tree for non-branched views
      let currentId: string | null = currentNodeId;
      while (currentId) {
        nodeIdsToDisplay.push(currentId);
        currentId = nodes[currentId]?.parentId;
      }
      
      // Reverse the array to maintain chronological order
      nodeIdsToDisplay.reverse();
    }
    
    // Create chat items for each node
    for (const nodeId of nodeIdsToDisplay) {
      const nodeData = nodes[nodeId];
      if (!nodeData) continue;
      
      chatItems.push(
        <div key={nodeData.id} id={`node-${nodeData.id}`} className="w-full max-w-3xl mx-auto mb-8">
          {nodeData.prompt && (
            <div className="flex justify-end mb-4">
              <div className="flex flex-col items-end">
                <div className="bg-[#78c288] text-black py-3 pl-6 pr-8 rounded-3xl inline-block max-w-[95%] shadow-sm transition-all duration-300 hover:shadow-md">
                  <p className="text-sm whitespace-nowrap">{nodeData.prompt}</p>
                </div>
              </div>
            </div>
          )}
          
          {nodeData.response && (
            <div className="flex flex-col mb-4">
              <div className="flex items-center mb-2 ml-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 font-color-green-700">🌲 TreeGPT</span>
                    {/* <span className="text-gray-500 text-sm flex items-center">
                      Used ChatGPT
                      <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span> */}
                  </div>
                </div>
              </div>
              
              <div className="ml-2 max-w-[95%]">
                <p className="text-base text-gray-800 whitespace-pre-wrap">{nodeData.response}</p>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return chatItems;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#FAF9F6]">
      {/* Header with TreeGPT logo and sidebar toggle */}
      <header className="w-full p-4 flex items-center">
        <button 
          className="mr-3 text-lg hover:bg-gray-100 p-2 rounded-full transition-colors"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 4V20" stroke="currentColor" strokeWidth="2"/>
            <circle cx="6" cy="10" r="1" fill="currentColor"/>
          </svg>
        </button>
        <div className="flex items-center">
          <span className="font-bold text-xl tracking-tight text-gray-800">
            Tree<span className="text-[#78c288]">GPT</span>
          </span>
        </div>
        
        {/* Tree Visualization Button */}
        {hasConversation && (
          <button
            onClick={() => setShowTreeVisualization(true)}
            className="ml-auto flex items-center px-3 py-1.5 bg-[#78c288] text-black rounded-full text-sm shadow-sm hover:bg-[#68b278] transition-colors"
          >
            view tree
          </button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-[#fdfcfa] border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}>
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            {/* <h2 className="font-medium text-gray-800">Conversation History</h2> */}
            <button 
              className="text-[#124015] hover:text-[#78c288] transition-colors"
              onClick={handleNewConversation}
              title="New Conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversationHistory.map(convo => (
              <div key={convo.id} className="border-b border-gray-100">
                <button 
                  className="w-full text-left px-4 py-3 hover:bg-white focus:outline-none transition-colors flex justify-between items-center"
                >
                  <div className="truncate text-sm font-medium text-gray-700">{convo.title}</div>
                </button>
                <div className="px-4 pb-2 flex justify-start">
                  <button 
                    className="text-xs text-gray-500 hover:text-[#78c288] flex items-center transition-colors"
                    onClick={() => setShowTreeVisualization(true)}
                  >
                    view tree
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* User profile and sign out section - fixed at bottom */}
          <div className="border-t border-gray-200 p-4 bg-[#fdfcfa] flex flex-col">
            <p className="text-sm font-medium text-gray-700 mb-3">{userEmail}</p>
            <button 
              className="w-full py-2 px-3 bg-white border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
              onClick={() => {/* Sign out functionality would go here */}}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Chat Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {hasConversation ? (
            <>
              {/* Chat history when conversation exists - removed the Answer header */}
              <div className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {renderChatHistory()}
                {isLoading && (
                  <div className="flex w-full max-w-3xl mx-auto mb-4">
                    <div className="flex flex-col">
                      <div className="flex items-center mb-2 ml-2">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">🌲 TreeGPT</span>
                            {/* <span className="text-gray-500 text-sm flex items-center">
                              Used ChatGPT
                              <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span> */}
                          </div>
                        </div>
                      </div>
                      <div className="ml-2">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Input area at bottom - removed border */}
              <div className="p-4">
                <div className="max-w-3xl mx-auto relative">
                  <input
                    type="text"
                    className="w-full pl-10 py-3 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-green-700 transition-all duration-200 text-gray-700 pr-16"
                    placeholder="Ask another question..."
                    value={userInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                  />
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Styled initial input without gray border and add branch */
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="w-[600px] max-w-[90%] flex flex-col items-center">
                <div className="text-6xl mb-6">🌲</div>
                <h2 className="text-green-800 text-2xl font-large mb-6 text-center font-bold">
                  Branch Your Prompts. Discover New Paths...
                </h2>
                
                <div className="w-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-2xl p-6 transform transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1">
                  {/* Search input wrapper - removed gray border */}
                  <div className="flex items-center p-[10px_16px]">
                    {/* Search icon - made smaller */}
                    <div className="text-[#888] mr-2.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                    {/* Search input */}
                    <input 
                      type="text" 
                      className="flex-grow border-none outline-none text-base py-2 px-0 focus:ring-0 placeholder-gray-400"
                      placeholder="Search or ask a question..."
                      value={userInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>      
      {/* Compare View Modal */}
      {compareNodes && nodes[compareNodes.leftId] && nodes[compareNodes.rightId] && (
        <CompareView
          leftNode={nodes[compareNodes.leftId]}
          rightNode={nodes[compareNodes.rightId]}
          onClose={() => setCompareNodes(null)}
        />
      )}
      
      {/* Tree Visualization Modal */}
      {showTreeVisualization && (
        <TreeVisualization
          nodes={nodes}
          rootId={rootId}
          currentNodeId={currentNodeId}
          onNodeSelect={(nodeId) => {
            setCurrentNodeId(nodeId);
            setShowTreeVisualization(false);
          }}
          onClose={() => setShowTreeVisualization(false)}
          onAddBranch={handleAddBranch}
          onDeleteBranch={handleDeleteBranch}
          onRenameBranch={handleRenameBranch}
        />
      )}
    </div>
  );
} 