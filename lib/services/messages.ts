import { apiService } from './api';
import { API_URL } from '../config/environment';
import io from 'socket.io-client';

export interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
}

export interface MessageDto {
  id: string;
  sender?: UserDto | null;
  senderId: number;
  receiver?: UserDto | null;
  receiverId: number;
  content: string | null;
  image?: {
    id: string;
    path: string;
  } | null;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationItem {
  user: UserDto;
  lastMessage: {
    id: string;
    content: string | null;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
}

export interface GetConversationsResponse {
  data: ConversationItem[];
  total: number;
}

export interface GetMessagesResponse {
  data: MessageDto[];
  meta: {
    total: number;
  };
}

export interface MessagesParams {
  page?: number;
  limit?: number;
  receiverId?: number;
}

// Singleton để quản lý WebSocket connection
export class MessageSocketService {
  private static instance: MessageSocketService;
  private socket: ReturnType<typeof io> | null = null;
  private listeners: Record<string, Set<Function>> = {
    newMessage: new Set(),
    messagesRead: new Set(),
  };
  private connected = false;
  private userId: number | null = null;

  private constructor() {
    // Private constructor để đảm bảo singleton
  }

  public static getInstance(): MessageSocketService {
    if (!MessageSocketService.instance) {
      MessageSocketService.instance = new MessageSocketService();
    }
    return MessageSocketService.instance;
  }

  public connect(userId: number): void {
    if (this.connected && this.userId === userId) return;
    
    this.disconnect();
    this.userId = userId;

    try {
      // Sử dụng API_URL trực tiếp từ environment
      const baseUrl = API_URL;
      
      this.socket = io(`${baseUrl}/messages`, {
        auth: { userId },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to message socket');
        this.connected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from message socket');
        this.connected = false;
      });

      this.socket.on('error', (error: any) => {
        console.error('Socket error:', error);
      });

      this.socket.on('newMessage', (message: MessageDto) => {
        this.listeners.newMessage.forEach(callback => callback(message));
      });

      this.socket.on('messagesRead', (data: { by: number }) => {
        this.listeners.messagesRead.forEach(callback => callback(data));
      });
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.userId = null;
    }
  }

  public onNewMessage(callback: (message: MessageDto) => void): () => void {
    this.listeners.newMessage.add(callback);
    return () => {
      this.listeners.newMessage.delete(callback);
    };
  }

  public onMessagesRead(callback: (data: { by: number }) => void): () => void {
    this.listeners.messagesRead.add(callback);
    return () => {
      this.listeners.messagesRead.delete(callback);
    };
  }

  public sendMessage(data: { receiverId: number; content: string }): void {
    if (!this.connected || !this.socket) return;
    this.socket.emit('sendMessage', data);
  }

  public markAsRead(senderId: number): void {
    if (!this.connected || !this.socket) return;
    this.socket.emit('markAsRead', { senderId });
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

export const messageSocketInstance = MessageSocketService.getInstance();

const messagesService = {
  getConversations: (params?: { page?: number; limit?: number }): Promise<GetConversationsResponse> => {
    return apiService.get('/messages/conversations', params);
  },

  getMessages: (params: MessagesParams): Promise<GetMessagesResponse> => {
    return apiService.get('/messages', params);
  },

  sendMessage: (data: { receiverId: number; content: string }): Promise<MessageDto> => {
    return apiService.post('/messages', data);
  },

  markAsRead: (senderId: number): Promise<void> => {
    return apiService.post(`/messages/${senderId}/read`, {});
  },
};

export default messagesService; 