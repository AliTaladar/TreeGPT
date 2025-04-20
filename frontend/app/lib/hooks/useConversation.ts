import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { NodeData, BranchState } from '../types';
import { chatService } from '../api/chatService';

/**
 * Hook for managing conversation state and interactions
 */
export function useConversation() {
  // State for conversation tree
  const [nodes, setNodes] = useState<Record<string, NodeData>>(() => {
    const rootId = uuidv4();
    return {
      [rootId]: {
        id: rootId,
        prompt: '',
        response: '',
        children: [],
        parentId: null,
      },
    };
  });
  
  // Track the root node and current node
  const [rootId] = useState<string>(() => Object.keys(nodes)[0]);
  const [currentNodeId, setCurrentNodeId] = useState<string>(rootId);
  
  // Track branching state
  const [branchedFrom, setBranchedFrom] = useState<BranchState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * Add a new prompt from the user
   */
  const addUserPrompt = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    
    // Create a new node for the prompt
    const newNodeId = uuidv4();
    const newNode: NodeData = {
      id: newNodeId,
      prompt,
      response: '',
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
    
    // Fetch AI response
    setIsLoading(true);
    try {
      const aiResponse = await chatService.getAIResponse(prompt);
      
      setNodes(prev => ({
        ...prev,
        [newNodeId]: {
          ...prev[newNodeId],
          response: aiResponse.text,
        },
      }));
    } catch (error) {
      console.error('Failed to get AI response:', error);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, currentNodeId]);
  
  /**
   * Create a branch from an existing node
   */
  const addBranch = useCallback(async (parentId: string, isAiResponse = false) => {
    const parentNode = nodes[parentId];
    if (!parentNode) return;
    
    const newNodeId = uuidv4();
    
    // Create new node with parent's prompt as a starting point
    const newNode: NodeData = {
      id: newNodeId,
      prompt: parentNode.prompt,
      response: '',
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
      setIsLoading(true);
      try {
        const aiResponse = await chatService.getAIResponse(newNode.prompt);
        
        setNodes(prev => ({
          ...prev,
          [newNodeId]: {
            ...prev[newNodeId],
            response: aiResponse.text,
          },
        }));
      } catch (error) {
        console.error('Failed to get AI response:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [nodes]);
  
  /**
   * Delete a branch and its children
   */
  const deleteBranch = useCallback((nodeId: string) => {
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
  
  /**
   * Rename a branch (update prompt)
   */
  const renameBranch = useCallback((nodeId: string, newPrompt: string) => {
    setNodes(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        prompt: newPrompt,
      },
    }));
  }, []);
  
  /**
   * Start a new conversation
   */
  const startNewConversation = useCallback(() => {
    const newRootId = uuidv4();
    
    setNodes({
      [newRootId]: {
        id: newRootId,
        prompt: '',
        response: '',
        children: [],
        parentId: null,
      },
    });
    
    setCurrentNodeId(newRootId);
    setBranchedFrom(null);
  }, []);
  
  /**
   * Save the current conversation
   */
  const saveConversation = useCallback(async (title: string) => {
    return await chatService.saveConversation(title, nodes, rootId);
  }, [nodes, rootId]);
  
  /**
   * Load a conversation by ID
   */
  const loadConversation = useCallback(async (id: string | number) => {
    try {
      const data = await chatService.loadConversation(id);
      
      if (data.nodes && Object.keys(data.nodes).length > 0 && data.rootId) {
        setNodes(data.nodes);
        setCurrentNodeId(data.rootId);
        setBranchedFrom(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load conversation:', error);
      return false;
    }
  }, []);
  
  return {
    nodes,
    rootId,
    currentNodeId,
    branchedFrom,
    isLoading,
    setCurrentNodeId,
    setBranchedFrom,
    addUserPrompt,
    addBranch,
    deleteBranch,
    renameBranch,
    startNewConversation,
    saveConversation,
    loadConversation,
  };
} 