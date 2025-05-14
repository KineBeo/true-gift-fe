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

export interface TypingStatus {
  userId: number;
  isTyping: boolean;
}

// Singleton để quản lý WebSocket connection
export class MessageSocketService {
  private static instance: MessageSocketService;
  private socket: ReturnType<typeof io> | null = null;
  private listeners: Record<string, Set<Function>> = {
    newMessage: new Set(),
    messagesRead: new Set(),
    userTyping: new Set(),
    error: new Set(),
    connectionStatus: new Set(),
  };
  private connected = false;
  private connecting = false;
  private userId: number | null = null;
  private token: string | null = null;
  private typingTimeouts: Record<number, ReturnType<typeof setTimeout>> = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 3000;

  private constructor() {
    // Private constructor để đảm bảo singleton
  }

  public static getInstance(): MessageSocketService {
    if (!MessageSocketService.instance) {
      MessageSocketService.instance = new MessageSocketService();
    }
    return MessageSocketService.instance;
  }

  public connect(userId: number, token: string): void {
    // Ngăn chặn các lệnh kết nối trùng lặp
    if ((this.connected || this.connecting) && this.userId === userId && this.token === token) return;
    
    this.disconnect();
    this.userId = userId;
    this.token = token;
    this.connecting = true;
    this.reconnectAttempts = 0;

    try {
      // Lấy base URL từ API_URL và tạo URL socket không bao gồm phần path /api/v1
      const baseUrl = this.getBaseUrl(API_URL || '');
      
      console.log(`Connecting to WebSocket at ${baseUrl}/messages`);
      
      // Remove 'Bearer ' prefix if it exists - WebSocket adapter expects raw token
      const rawToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      
      // Kết nối tới socket.io với đúng namespace
      this.socket = io(`${baseUrl}/messages`, {
        auth: { 
          token: rawToken,
          userId
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 5000,
        path: '/socket.io' // Đường dẫn mặc định cho socket.io
      });

      this.registerSocketEvents();
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.handleConnectionError(error);
    }
  }

  // Helper để lấy base URL từ API URL (loại bỏ /api/v1)
  private getBaseUrl(apiUrl: string): string {
    if (!apiUrl) return '';
    
    try {
      const url = new URL(apiUrl);
      
      // Xóa các path như /api, /api/v1 từ URL
      // Chỉ giữ lại protocol và host
      return `${url.protocol}//${url.host}`;
    } catch (error) {
      console.error('Invalid API URL:', error);
      
      // Fallback: Cố gắng cắt path /api/v1 nếu có
      const apiPathIndex = apiUrl.indexOf('/api');
      if (apiPathIndex > 0) {
        return apiUrl.substring(0, apiPathIndex);
      }
      
      return apiUrl; // Return original API URL as fallback instead of empty string
    }
  }

  private registerSocketEvents(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to message socket');
      this.connected = true;
      this.connecting = false;
      this.reconnectAttempts = 0;
      this.listeners.connectionStatus.forEach(callback => callback(true));
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from message socket');
      this.connected = false;
      this.listeners.connectionStatus.forEach(callback => callback(false));
      this.attemptReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleConnectionError(error);
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      this.listeners.error.forEach(callback => callback(error));
    });

    this.socket.on('newMessage', (message: MessageDto) => {
      console.log('New message received:', message);
      this.listeners.newMessage.forEach(callback => callback(message));
    });

    this.socket.on('messagesRead', (data: { by: number }) => {
      console.log('Messages read by:', data.by);
      this.listeners.messagesRead.forEach(callback => callback(data));
    });

    this.socket.on('userTyping', (status: TypingStatus) => {
      this.listeners.userTyping.forEach(callback => callback(status));
    });
  }

  private handleConnectionError(error: any): void {
    this.connecting = false;
    this.connected = false;
    
    // Log chi tiết lỗi để tiện debug
    if (error.message) {
      console.error(`WebSocket connection error: ${error.message}`);
    } else {
      console.error('WebSocket connection error:', error);
    }
    
    // Thông báo lỗi cho listeners
    this.listeners.error.forEach(callback => 
      callback({ message: 'Failed to connect to WebSocket', details: error })
    );
    
    // Nếu lỗi là "Invalid namespace", không cần thử reconnect
    // vì đây là lỗi cấu hình, reconnect không giải quyết được
    if (error.message && error.message.includes('Invalid namespace')) {
      console.log('Not attempting reconnect due to namespace configuration error');
      return;
    }
    
    // Thử kết nối lại nếu là lỗi tạm thời
    this.attemptReconnect();
  }

  private attemptReconnect(): void {
    // Tránh nhiều lệnh reconnect chạy đồng thời
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Tăng số lần thử kết nối
    this.reconnectAttempts++;
    
    // Nếu đã vượt quá số lần thử kết nối tối đa, dừng lại
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.log(`Exceeded maximum reconnect attempts (${this.maxReconnectAttempts})`);
      return;
    }
    
    // Tăng dần thời gian giữa các lần kết nối (3s, 6s, 9s, 12s, 15s)
    const delay = this.reconnectDelay * this.reconnectAttempts;
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      if (this.userId && this.token) {
        console.log(`Reconnecting attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect(this.userId, this.token);
      }
    }, delay);
  }

  public disconnect(): void {
    // Hủy bỏ timer reconnect nếu có
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connected = false;
    this.connecting = false;
    this.userId = null;
    this.token = null;
    this.reconnectAttempts = 0;
    
    // Xóa tất cả các timeout typing status
    Object.values(this.typingTimeouts).forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts = {};
    
    this.listeners.connectionStatus.forEach(callback => callback(false));
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

  public onUserTyping(callback: (status: TypingStatus) => void): () => void {
    this.listeners.userTyping.add(callback);
    return () => {
      this.listeners.userTyping.delete(callback);
    };
  }

  public onConnectionStatus(callback: (connected: boolean) => void): () => void {
    this.listeners.connectionStatus.add(callback);
    // Gọi callback ngay lập tức với trạng thái hiện tại
    callback(this.connected);
    return () => {
      this.listeners.connectionStatus.delete(callback);
    };
  }

  public onError(callback: (error: any) => void): () => void {
    this.listeners.error.add(callback);
    return () => {
      this.listeners.error.delete(callback);
    };
  }

  public sendMessage(data: { receiverId: number; content: string }): Promise<MessageDto> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.socket) {
        // Thử kết nối lại nếu chưa kết nối và có thông tin cần thiết
        if (!this.connecting && this.userId && this.token) {
          console.log('Socket not connected. Attempting to reconnect before sending message...');
          this.connect(this.userId, this.token);
          reject(new Error('Socket reconnecting. Please try again shortly.'));
        } else {
          reject(new Error('Socket not connected'));
        }
        return;
      }
      
      // Ensure we explicitly include the userId in the message data for the backend
      const messageData = {
        ...data,
        senderId: this.userId // Add the sender ID explicitly
      };
      
      console.log('Sending message:', messageData);
      this.socket.emit('sendMessage', messageData, (response: any) => {
        // Xử lý định dạng phản hồi mới
        console.log('Message response:', response);
        
        // Kiểm tra cả định dạng mới và cũ để tương thích
        if (response && response.success === true && response.data) {
          console.log('Message sent successfully with new format:', response.data);
          resolve(response.data);
        } else if (response && response.event === 'messageSent' && response.data) {
          console.log('Message sent successfully with old format:', response.data);
          resolve(response.data);
        } else {
          console.error('Failed to send message:', response);
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });

      // Reset typing status sau khi gửi tin nhắn
      this.sendTypingStatus(data.receiverId, false);
    });
  }

  public markAsRead(senderId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.socket) {
        // Thử kết nối lại nếu chưa kết nối và có thông tin cần thiết
        if (!this.connecting && this.userId && this.token) {
          console.log('Socket not connected. Attempting to reconnect before marking as read...');
          this.connect(this.userId, this.token);
          reject(new Error('Socket reconnecting. Please try again shortly.'));
        } else {
          reject(new Error('Socket not connected'));
        }
        return;
      }
      
      // Ensure we explicitly include userId in the request data
      const readData = { 
        senderId,
        readerId: this.userId // Add reader ID explicitly
      };
      
      console.log('Marking messages as read from sender:', readData);
      this.socket.emit('markAsRead', readData, (response: any) => {
        console.log('Mark as read response:', response);
        
        // Kiểm tra cả định dạng mới và cũ để tương thích
        if (response && response.success === true) {
          console.log('Messages marked as read successfully with new format');
          resolve();
        } else if (response && response.event === 'messagesRead' && response.data && response.data.success) {
          console.log('Messages marked as read successfully with old format');
          resolve();
        } else {
          console.error('Failed to mark messages as read:', response);
          reject(new Error(response?.error || 'Failed to mark messages as read'));
        }
      });
    });
  }

  public sendTypingStatus(receiverId: number, isTyping: boolean): void {
    if (!this.connected || !this.socket) {
      console.log('Cannot send typing status: Socket not connected');
      return;
    }
    
    // Xóa timeout hiện tại nếu có
    if (this.typingTimeouts[receiverId]) {
      clearTimeout(this.typingTimeouts[receiverId]);
      delete this.typingTimeouts[receiverId];
    }
    
    // Gửi trạng thái typing
    this.socket.emit('typing', { receiverId, isTyping });
    
    // Nếu đang typing, tự động reset sau 3 giây
    if (isTyping) {
      this.typingTimeouts[receiverId] = setTimeout(() => {
        this.sendTypingStatus(receiverId, false);
      }, 3000);
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public isConnecting(): boolean {
    return this.connecting;
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