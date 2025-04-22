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

export interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  photo?: string;
  // Other user fields may be added here
}

export interface SearchUsersResponse {
  data: UserDto[];
  hasNextPage: boolean;
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

  acceptFriendRequest: (friendshipId: string): Promise<void> => {
    const id = typeof friendshipId === 'number' ? String(friendshipId) : friendshipId;
    return apiService.post(`/friends/${id}/accept`, {});
  },

  removeFriend: (friendId: string): Promise<void> => {
    return apiService.delete(`/friends/${friendId}`);
  },
  
  searchUsers: (search: string, params?: { page?: number; limit?: number }): Promise<SearchUsersResponse> => {
    return apiService.get('/users/search', { search, ...params });
  }
};

export default friendsService; 