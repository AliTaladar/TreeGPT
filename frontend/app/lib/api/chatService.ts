import { AIResponse, ChatCompletionRequest, NodeData } from '../types';
import { apiClient } from './apiClient';

/**
 * Chat service for conversation management
 */
export class ChatService {
  /**
   * Fetch an AI response from the backend
   */
  async getAIResponse(prompt: string, conversationId?: string, parentMessageId?: string): Promise<AIResponse> {
    try {
      // Build the request payload
      const payload: ChatCompletionRequest = {
        prompt,
        conversationId,
        parentMessageId,
      };

      // Make API request
      return await apiClient.post<AIResponse, ChatCompletionRequest>('/chat', payload);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      // For development, fallback to simulation if API fails
      if (process.env.NODE_ENV === 'development') {
        return this.simulateAIResponse(prompt);
      }
      throw error;
    }
  }

  /**
   * Get the user's conversation history
   */
  async getConversations() {
    try {
      return await apiClient.get<{id: number; title: string}[]>('/conversations');
    } catch (error) {
      console.error('Failed to get conversations:', error);
      // For development, return sample data
      if (process.env.NODE_ENV === 'development') {
        return this.getSampleConversations();
      }
      return [];
    }
  }

  /**
   * Save the current conversation tree
   */
  async saveConversation(
    title: string, 
    nodes: Record<string, NodeData>, 
    rootId: string
  ) {
    try {
      return await apiClient.post('/conversations', { title, nodes, rootId });
    } catch (error) {
      console.error('Failed to save conversation:', error);
      // Just return an empty object for now if it fails
      return {};
    }
  }

  /**
   * Load a conversation by ID
   */
  async loadConversation(id: string | number) {
    try {
      return await apiClient.get<{nodes: Record<string, NodeData>; rootId: string}>(`/conversations/${id}`);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      // Return empty data if it fails
      return { nodes: {}, rootId: '' };
    }
  }

  /**
   * Simulate an AI response (for development)
   */
  private async simulateAIResponse(prompt: string): Promise<AIResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Sample responses based on prompt content
    let responseText: string;
    
    if (prompt.toLowerCase().includes("time") || prompt.toLowerCase().includes("date")) {
      responseText = `It's ${new Date().toLocaleString()}.\n\nRight on the edge of golden hour—perfect time to wrap up the day strong or start something bold 🧠✨`;
    } else {
      const responses = [
        "I understand your question about \"${prompt}\". Based on my knowledge, this involves several key factors that we should consider...",
        "That's an interesting query about \"${prompt}\". Let me provide some insights that might help you...",
        "When it comes to \"${prompt}\", there are multiple perspectives to consider. First, let's examine the fundamental concepts...",
        "\"${prompt}\" is a fascinating topic. From my analysis, I can tell you that experts in this field typically approach this by...",
        "I've processed your question about \"${prompt}\". Here's what I can tell you based on my training data and algorithms..."
      ];
      
      // Pick a random response and substitute the prompt
      const responseTemplate = responses[Math.floor(Math.random() * responses.length)];
      responseText = responseTemplate.replace("${prompt}", prompt) + 
        "\n\nFurther analysis would suggest that there are " + Math.floor(Math.random() * 5 + 2) + 
        " key aspects to consider when approaching this. Would you like me to elaborate on any specific aspect?";
    }
    
    return {
      text: responseText,
      messageId: `msg_${Date.now()}`,
      conversationId: `conv_${Date.now()}`,
      model: 'gpt-3.5-turbo-simulated'
    };
  }

  /**
   * Sample conversation data for development
   */
  private getSampleConversations() {
    return [
      { id: 1, title: "AI Ethics and Guidelines" },
      { id: 2, title: "The Future of Machine Learning" },
      { id: 3, title: "JavaScript Best Practices" },
      { id: 4, title: "Data Visualization Techniques" },
      { id: 5, title: "Neural Networks Explained" },
      { id: 6, title: "Quantum Computing Basics" },
      { id: 7, title: "Climate Change Solutions" },
    ];
  }
}

// Export a singleton instance
export const chatService = new ChatService(); 