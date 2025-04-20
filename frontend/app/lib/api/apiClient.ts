import { API_BASE_URL } from '../utils/config';

/**
 * Simple API client for all backend communication
 */
class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a GET request to the API
   */
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Send a POST request to the API
   */
  async post<T, D = Record<string, unknown>>(endpoint: string, data: D, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Send a PUT request to the API
   */
  async put<T, D = Record<string, unknown>>(endpoint: string, data: D, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Send a DELETE request to the API
   */
  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * Core request method handling all API communication
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    // Always include credentials for authentication
    const requestOptions: RequestInit = {
      ...options,
      credentials: 'include',
    };

    try {
      const response = await fetch(url, requestOptions);
      
      // Handle different response status codes
      if (!response.ok) {
        if (response.status === 401) {
          // Handle authentication errors
          throw new Error('Authentication required');
        }
        
        // Try to parse error response
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `API Error: ${response.status} ${response.statusText}`
        );
      }
      
      // Check if the response has content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return {} as T;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const apiClient = new ApiClient(); 