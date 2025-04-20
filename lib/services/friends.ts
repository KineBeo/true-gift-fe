import { apiService } from './api';

export interface FriendDto {
  id: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    photo?: string;
  } | null;
  userId: number;
  friend?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    photo?: string;
  } | null;
  friendId: number;
  isAccepted: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetFriendsResponse {
  data: FriendDto[];
  total: number;
}

export interface GetFriendRequestsResponse {
  data: FriendDto[];
  total: number;
}

export interface FriendParams {
  page?: number;
  limit?: number;
  isAccepted?: boolean;
  isBlocked?: boolean;
  includeRelations?: boolean;
}

export interface CreateFriendRequest {
  friendId?: number;
  email?: string;
}

const friendsService = {
  getFriends: (params?: FriendParams): Promise<GetFriendsResponse> => {
    return apiService.get('/friends', params);
  },

  getFriendRequests: (params?: { page?: number; limit?: number }): Promise<GetFriendRequestsResponse> => {
    return apiService.get('/friends/requests', params);
  },

  sendFriendRequest: (data: CreateFriendRequest): Promise<FriendDto> => {
    return apiService.post('/friends', data);
  },

  acceptFriendRequest: (friendId: number): Promise<void> => {
    return apiService.post(`/friends/${friendId}/accept`, {});
  },

  removeFriend: (friendId: string): Promise<void> => {
    return apiService.delete(`/friends/${friendId}`);
  }
};

export default friendsService; 