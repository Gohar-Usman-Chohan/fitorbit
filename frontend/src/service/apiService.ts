
export interface ChatbotRequest {
  message: string;
}

export interface ChatbotResponse {
  success: boolean;
  domain?: string;
  intent?: string;
  reply: {
    success: boolean;
    content: string;
    messages?: any[];
    metadata?: {
      duration: number;
      timestamp: string;
    };
  } | string;
  error?: boolean;
  message?: string;
}

export interface BudgetInfo {
  total: number;
  spent: number;
  remaining: number;
  percentage: number;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async sendMessage(message: string): Promise<ChatbotResponse> {
    try {
      const response = await fetch(`${this.baseURL}/chatbot`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatbotResponse = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Additional methods for chat sessions if you implement them later
  async getChatSessions(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/chat-sessions`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
      return [];
    }
  }

  async createNewChatSession(title: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/chat-sessions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create chat session:', error);
      throw error;
    }
  }

  // Budget-related methods
  async getBudgetInfo(): Promise<BudgetInfo | null> {
    try {
      const response = await fetch(`${this.baseURL}/budget`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch budget info:', error);
      return null;
    }
  }
}

export const apiService = new ApiService();