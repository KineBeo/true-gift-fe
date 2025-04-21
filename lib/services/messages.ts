import { apiService } from './api';

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