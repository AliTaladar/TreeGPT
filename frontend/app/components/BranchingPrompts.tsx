"use client";

import { useState, useCallback, KeyboardEvent, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { NodeData } from "./PromptNode";
import CompareView from "./CompareView";
import TreeVisualization from "./TreeVisualization";
import axios from 'axios';
import Login from './Login';
import Register from './Register';

interface Conversation {
  _id: string;
  title: string;
}

interface Message {
  _id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: string;
  parentId: string | null;
}

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

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rootId, setRootId] = useState<string | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [branchedFrom, setBranchedFrom] = useState<{ nodeId: string, isAiResponse: boolean } | null>(null);
  const [compareNodes, setCompareNodes] = useState<{
    leftId: string;
    rightId: string;
  } | null>(null);
  const [showTreeVisualization, setShowTreeVisualization] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token); // Set to true if token exists, false otherwise
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchConversations = async () => {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/conversations`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            // Sort conversations by newest first (assuming _id or response data contains a createdAt)
            const sortedConversations = [...response.data].sort((a, b) => {
              // Try multiple sorting strategies
              if (a.updatedAt && b.updatedAt) {
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
              }
              if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              }
              // Fallback to _id (MongoDB ObjectIDs have creation time embedded)
              return b._id.localeCompare(a._id);
            });
            setConversations(sortedConversations);
          }
        } catch (error) {
          console.error('Error fetching conversations:', error);
        }
      };
      fetchConversations();
    } else {
      setConversations([]); // Clear conversations if not authenticated
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedConversationId && isAuthenticated) {
      const fetchMessages = async () => {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const response = await axios.get<Message[]>(
              `${process.env.NEXT_PUBLIC_API_URL}/conversations/${selectedConversationId}/messages`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            setMessages(response.data);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };
      fetchMessages();
    } else {
      setMessages([]); // Clear messages if not authenticated or no conversation selected
    }
  }, [selectedConversationId, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchUserProfile = async () => {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setUserEmail(response.data.email);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserEmail(null); // Fallback if fetch fails
        }
      };
      fetchUserProfile();
    } else {
      setUserEmail(null); // Clear email when not authenticated
    }
  }, [isAuthenticated]);

  // const 

  const buildTree = useCallback((messages: Message[]): Record<string, NodeData> => {
    const messageMap = new Map(messages.map(msg => [msg._id, msg]));

    const findAssistantMessage = (userId: string): Message | undefined => {
      return messages.find(msg => msg.parentId === userId && msg.type === 'assistant');
    };

    const buildNode = (userId: string, parentUserId: string | null): NodeData => {
      const userMessage = messageMap.get(userId);
      if (!userMessage || userMessage.type !== 'user') {
        throw new Error('Invalid user message');
      }
      const assistantMessage = findAssistantMessage(userId);
      const childUserMessages = assistantMessage
        ? messages.filter(msg => msg.parentId === assistantMessage._id && msg.type === 'user')
        : [];
      return {
        id: userId,
        prompt: userMessage.content,
        response: assistantMessage?.content ?? '', // Default to empty string if no response
        children: childUserMessages.map(child => child._id),
        parentId: parentUserId,
      };
    };

    const rootUserMessages = messages.filter(msg => msg.parentId === null && msg.type === 'user');
    if (rootUserMessages.length === 0) {
      return {};
    }

    const rootUserId = rootUserMessages[0]._id;
    const nodes: Record<string, NodeData> = {};
    const queue: { userId: string; parentUserId: string | null }[] = [
      { userId: rootUserId, parentUserId: null },
    ];

    while (queue.length > 0) {
      const { userId, parentUserId } = queue.shift()!;
      const node = buildNode(userId, parentUserId);
      nodes[userId] = node;
      node.children.forEach(childUserId => {
        queue.push({ userId: childUserId, parentUserId: userId });
      });
    }

    return nodes;
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const treeNodes = buildTree(messages);
      const rootUserMessage = messages.find(msg => msg.parentId === null && msg.type === 'user');
      if (rootUserMessage) {
        setNodes(treeNodes);
        setRootId(rootUserMessage._id);

        const latestUserMessage = messages.reduce<Message | null>((latest: Message | null, msg: Message) => {
          if (msg.type === 'user') {
            return !latest || new Date(msg.timestamp) > new Date(latest.timestamp) ? msg : latest;
          }
          return latest;
        }, null);
        if (latestUserMessage) {
          setCurrentNodeId(latestUserMessage._id);
        }
      }
    } else {
      setNodes({});
      setRootId(null);
      setCurrentNodeId(null); // Reset when there are no messages
    }
  }, [messages, buildTree]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleRegister = () => {
    setShowLogin(true);
  };

  const toggleForm = () => {
    setShowLogin(!showLogin);
  };

  const getAssistantMessageId = useCallback((nodeId: string): string | null => {
    const assistantMessage = messages.find(msg => msg.parentId === nodeId && msg.type === 'assistant');
    return assistantMessage ? assistantMessage._id : null;
  }, [messages]);

  // Check if conversation has started
  const hasConversation = messages.length > 0;



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && userInput.trim()) {
      e.preventDefault();
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!selectedConversationId) {
          const convResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/conversations`, { title: userInput }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const newConversation = convResponse.data;
          setSelectedConversationId(newConversation._id);
          setConversations(prev => [...prev, newConversation]);
          const msgResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/conversations/${newConversation._id}/messages`, {
            content: userInput,
            parentId: null,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const [newUserMessage, newAssistantMessage] = msgResponse.data;
          setMessages([newUserMessage, newAssistantMessage]);
          setCurrentNodeId(newUserMessage._id);
        } else {
          const parentId = currentNodeId ? getAssistantMessageId(currentNodeId) : null;
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/conversations/${selectedConversationId}/messages`, {
            content: userInput,
            parentId,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const [newUserMessage, newAssistantMessage] = response.data;
          setMessages(prev => [...prev, newUserMessage, newAssistantMessage]);
          setCurrentNodeId(newUserMessage._id);
        }
        setUserInput("");
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Update handleAddBranch to always fetch response immediately
  const handleAddBranch = useCallback(async (parentId: string, isAiResponse = false) => {
    const parentNode = nodes[parentId];
    if (!parentNode) return;
    const prompt = parentNode.prompt;
    const parentAssistantId = getAssistantMessageId(parentId);
    if (!parentAssistantId) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/conversations/${selectedConversationId}/messages`, {
        content: prompt,
        parentId: parentAssistantId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const [newUserMessage, newAssistantMessage] = response.data;
      setMessages(prev => [...prev, newUserMessage, newAssistantMessage]);
      setCurrentNodeId(newUserMessage._id);
      setBranchedFrom({ nodeId: parentId, isAiResponse });
    } catch (error) {
      console.error('Error adding branch:', error);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, selectedConversationId, getAssistantMessageId]);

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
    if (currentNodeId === nodeId || (currentNodeId !== null && !updatedNodes[currentNodeId])) {
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
  const handleNewConversation = async () => {
    try {
      setSelectedConversationId(null);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSignOut: () => void = () => {
    localStorage.removeItem('token');           // Remove the JWT token from localStorage
    setIsAuthenticated(false);                  // Update authentication state to false
    setShowLogin(true);                         // Ensure the login form is shown after sign-out
    setConversations([]);                       // Reset conversations to an empty array
    setMessages([]);                            // Reset messages to an empty array
    setSelectedConversationId(null);            // Clear selected conversation
    setCurrentNodeId(null);                     // Clear current node ID
    setRootId(null);                            // Clear root ID
    setNodes({});                               // Reset nodes object
    setBranchedFrom(null);                      // Clear branched-from reference
    setCompareNodes(null);                      // Clear comparison nodes
    setShowTreeVisualization(false);            // Hide tree visualization
    setUserInput("");                           // Clear user input field
    setIsLoading(false);                        // Reset loading state
    setSidebarOpen(false);                      // Close the sidebar
  };

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
      if (currentNodeId !== null) {
        nodeIdsToDisplay.push(currentNodeId);
      }

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
      if (currentNodeId !== null) {
        nodeIdsToDisplay.push(currentNodeId);
      }

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

          <div className="flex flex-col mb-4">
            <div className="flex items-center mb-2 ml-2">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 font-color-green-700">🌲 TreeGPT</span>
                </div>
              </div>
            </div>
            <div className="ml-2 max-w-[95%]">
              {nodeData.response ? (
                <p className="text-base text-gray-800 whitespace-pre-wrap">{nodeData.response}</p>
              ) : (
                <p className="text-base text-gray-500">Waiting for response...</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return chatItems;
  };

  if (!isAuthenticated) {
    return showLogin ? (
      <Login onLogin={handleLogin} toggleForm={toggleForm} />
    ) : (
      <Register onRegister={handleRegister} toggleForm={toggleForm} />
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#FAF9F6]">
      {/* Header with TreeGPT logo and sidebar toggle */}
      <header className="w-full p-4 flex items-center">
        <button
          className="mr-3 text-lg hover:bg-gray-100 p-2 rounded-full transition-colors text-gray-800"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="4"
              width="18"
              height="16"
              rx="3"
              stroke="currentColor"
              strokeWidth="2"
            ></rect>
            <path d="M9 4V20" stroke="currentColor" strokeWidth="2"></path>
            <circle cx="6" cy="10" r="1" fill="currentColor"></circle>
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
            {conversations
              .slice() // Create a copy to avoid mutating original
              .sort((a, b) => b._id.localeCompare(a._id)) // Simple string comparison (newer IDs are larger)
              .map(convo => (
              <div key={convo._id} className="border-b border-gray-100">
                <button
                  className="w-full text-left px-4 py-3 hover:bg-white focus:outline-none transition-colors flex justify-between items-center"
                  onClick={() => {
                    setSelectedConversationId(convo._id);
                  }}
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
          <div className="border-t border-gray-200 p-4 bg-[#fdfcfa] flex flex-col">
            <p className="text-sm font-medium text-gray-700 mb-3">{userEmail}</p>
            <button
              className="w-full py-2 px-3 bg-white border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
              onClick={handleSignOut}
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
                      className="flex-grow border-none outline-none text-base py-2 px-0 focus:ring-0 placeholder-gray-400 text-gray-800"
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
      {showTreeVisualization && rootId !== null && currentNodeId !== null && (
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