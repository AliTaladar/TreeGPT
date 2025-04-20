// Node data structure for the conversation tree
export interface NodeData {
  id: string;
  prompt: string;
  response: string;
  children: string[];
  parentId: string | null;
}

// Conversation history item for sidebar
export interface ConversationHistoryItem {
  id: number;
  title: string;
  date?: string;
}

// Response from the AI API
export interface AIResponse {
  text: string;
  messageId: string;
  conversationId?: string;
  model?: string;
}

// API Request parameters for chat completion
export interface ChatCompletionRequest {
  prompt: string;
  conversationId?: string;
  parentMessageId?: string;
}

// State for branching from a specific point in the conversation
export interface BranchState {
  nodeId: string;
  isAiResponse: boolean;
}

// Compare view state for comparing different branches
export interface CompareNodesState {
  leftId: string;
  rightId: string;
} 