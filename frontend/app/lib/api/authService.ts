import { apiClient } from './apiClient';

export interface User {
  id: string;
  email: string;
  name?: string;
}

/**
 * Authentication service for user management
 */
export class AuthService {
  // Store current user info
  private currentUser: User | null = null;

  /**
   * Get the currently authenticated user
   */
  async getUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const user = await apiClient.get<User>('/auth/user');
      this.currentUser = user;
      return user;
    } catch (error: unknown) {
      // Not authenticated or error
      console.log('Auth error:', error);
      this.currentUser = null;
      return null;
    }
  }

  /**
   * Log in with credentials
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const user = await apiClient.post<User>('/auth/login', { email, password });
      this.currentUser = user;
      return user;
    } catch (error) {
      this.currentUser = null;
      throw error;
    }
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      this.currentUser = null;
    }
  }

  /**
   * Check if the user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getUser();
    return user !== null;
  }
}

// Export a singleton instance
export const authService = new AuthService(); 