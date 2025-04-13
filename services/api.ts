import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API URL từ backend NestJS
const API_URL = 'http://localhost:3000';
const API_PREFIX = '/api/v1'; // Thêm tiền tố API nếu cần

// Tạo instance axios với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_URL + API_PREFIX,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động thêm token vào header
apiClient.interceptors.request.use(
  async (config: any) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Thêm interceptor để tự động refresh token khi nhận 401
apiClient.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    if (!error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    
    // Nếu token hết hạn (status 401) và chưa thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Thực hiện refresh token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Nếu không có refresh token, đăng xuất người dùng
          await logout();
          return Promise.reject(error);
        }
        
        const { data } = await axios.post(`${API_URL}${API_PREFIX}/auth/refresh`, {}, {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          }
        });
        
        // Lưu token mới
        await AsyncStorage.setItem('accessToken', data.token);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
        
        // Thử lại request với token mới
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Nếu refresh token cũng không hợp lệ, đăng xuất người dùng
        await logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// =========== AUTH APIs ===========

// Đăng nhập
export const login = async (email: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/email/login', { email, password });
    // Lưu accessToken từ response
    await AsyncStorage.setItem('accessToken', response.data.token);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    
    // Lưu thông tin người dùng nếu có
    if (response.data.user) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Lỗi đăng nhập:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Đăng ký
export const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
  try {
    const userData: any = { email, password };
    if (firstName) userData.firstName = firstName;
    if (lastName) userData.lastName = lastName;
    
    const response = await apiClient.post('/auth/email/register', userData);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi đăng ký:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Xác nhận email
export const confirmEmail = async (hash: string) => {
  try {
    const response = await apiClient.post('/auth/email/confirm', { hash });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Gửi yêu cầu xác nhận email mới
export const requestNewConfirmation = async (hash: string) => {
  try {
    const response = await apiClient.post('/auth/email/confirm/new', { hash });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Quên mật khẩu
export const forgotPassword = async (email: string) => {
  try {
    const response = await apiClient.post('/auth/forgot/password', { email });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Đặt lại mật khẩu
export const resetPassword = async (hash: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/reset/password', { hash, password });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Lấy thông tin người dùng
export const getProfile = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Cập nhật thông tin người dùng
export const updateProfile = async (userData: {
  firstName?: string,
  lastName?: string,
  password?: string,
  oldPassword?: string,
  email?: string
}) => {
  try {
    const response = await apiClient.patch('/auth/me', userData);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Xóa tài khoản
export const deleteAccount = async () => {
  try {
    const response = await apiClient.delete('/auth/me');
    await logout();
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Đăng nhập bằng Google
export const googleLogin = async (idToken: string) => {
  try {
    const response = await apiClient.post('/auth/google/login', { idToken });
    await AsyncStorage.setItem('accessToken', response.data.token);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    
    if (response.data.user) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Đăng nhập bằng Facebook
export const facebookLogin = async (accessToken: string) => {
  try {
    const response = await apiClient.post('/auth/facebook/login', { accessToken });
    await AsyncStorage.setItem('accessToken', response.data.token);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    
    if (response.data.user) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Đăng xuất
export const logout = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      await apiClient.post('/auth/logout');
    }
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error);
  } finally {
    // Luôn xóa token khỏi local storage
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
  }
};

// Kiểm tra tình trạng đăng nhập
export const checkAuthStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) return false;
    
    // Thực hiện kiểm tra token với backend
    await apiClient.get('/auth/me');
    return true;
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái đăng nhập:', error);
    return false;
  }
};

// =========== FRIENDS APIs ===========

// Gửi lời mời kết bạn
export const sendFriendRequest = async (emailOrId: string | number) => {
  try {
    // Nếu là email, gửi dạng { email }, nếu là số, gửi dạng { friendId }
    const payload = typeof emailOrId === 'string' 
      ? { email: emailOrId } 
      : { friendId: emailOrId };
    
    const response = await apiClient.post('/friends', payload);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi gửi lời mời kết bạn:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Lấy danh sách bạn bè
export const getFriends = async (params?: {
  isAccepted?: boolean;
  isBlocked?: boolean;
  page?: number;
  limit?: number;
  relations?: boolean;
  includeRelations?: boolean;
}) => {
  try {
    // Clone params để tránh thay đổi object gốc
    const queryParams = { ...params };
    
    // Luôn yêu cầu relations để có thông tin đầy đủ về bạn bè
    queryParams.includeRelations = true;
    
    delete queryParams.relations; // Không gửi tham số này đến backend
    
    const response = await apiClient.get('/friends', { params: queryParams });
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách bạn bè:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Lấy danh sách lời mời kết bạn
export const getFriendRequests = async (page?: number, limit?: number) => {
  try {
    const params = { page, limit };
    const response = await apiClient.get('/friends/requests', { params });
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách lời mời kết bạn:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Chấp nhận lời mời kết bạn
export const acceptFriendRequest = async (friendId: number) => {
  try {
    const response = await apiClient.post(`/friends/${friendId}/accept`);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi chấp nhận lời mời kết bạn:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Xóa bạn bè hoặc từ chối lời mời kết bạn
export const removeFriend = async (friendId: string) => {
  try {
    const response = await apiClient.delete(`/friends/${friendId}`);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi xóa bạn bè:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Chặn/bỏ chặn bạn bè
export const updateFriendStatus = async (friendId: string, isBlocked: boolean) => {
  try {
    const response = await apiClient.patch(`/friends/${friendId}`, { isBlocked });
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi cập nhật trạng thái bạn bè:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// =========== MESSAGES APIs ===========

// Định nghĩa kiểu dữ liệu cho response của getMessages
interface MessagesResponse {
  data: any[];
  meta?: {
    total: number;
    page?: number;
    limit?: number;
  };
  total?: number; // Cho phép có cấu trúc cũ
}

// Gửi tin nhắn
export const sendMessage = async (receiverId: number | string, content?: string, imageId?: number) => {
  try {
    // Đảm bảo receiverId là số
    const numericReceiverId = Number(receiverId);
    if (isNaN(numericReceiverId)) {
      throw new Error('receiverId phải là số hợp lệ');
    }
    
    const messageData: any = { receiverId: numericReceiverId };
    if (content) messageData.content = content;
    if (imageId) messageData.imageId = imageId;
    
    const response = await apiClient.post('/messages', messageData);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi gửi tin nhắn:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Lấy danh sách tin nhắn
export const getMessages = async (params?: {
  receiverId?: number | string;
  senderId?: number | string;
  isRead?: boolean;
  isDeleted?: boolean;
  page?: number;
  limit?: number;
}): Promise<MessagesResponse> => {
  try {
    // Tạo một bản sao của params để tránh thay đổi đối tượng gốc
    const safeParams: any = { ...params };
    
    // Đảm bảo receiverId là số
    if (safeParams?.receiverId !== undefined) {
      safeParams.receiverId = Number(safeParams.receiverId);
      if (isNaN(safeParams.receiverId)) {
        throw new Error('receiverId phải là số hợp lệ');
      }
    }
    
    // Đảm bảo senderId là số
    if (safeParams?.senderId !== undefined) {
      safeParams.senderId = Number(safeParams.senderId);
      if (isNaN(safeParams.senderId)) {
        throw new Error('senderId phải là số hợp lệ');
      }
    }
    
    try {
      const response = await apiClient.get('/messages', { params: safeParams });
      
      // Tạo và trả về đối tượng response chuẩn hóa dựa trên cấu trúc API
      const apiResponse = response.data;
      
      const standardResponse: MessagesResponse = {
        data: apiResponse.data || [],
      };
      
      // Xử lý trường hợp API trả về meta hoặc total
      if (apiResponse.meta && typeof apiResponse.meta === 'object') {
        standardResponse.meta = {
          total: apiResponse.meta.total || 0,
          page: apiResponse.meta.page || safeParams.page || 1,
          limit: apiResponse.meta.limit || safeParams.limit || 20
        };
      } else if (apiResponse.total !== undefined) {
        standardResponse.total = apiResponse.total;
        standardResponse.meta = {
          total: apiResponse.total,
          page: safeParams.page || 1,
          limit: safeParams.limit || 20
        };
      } else {
        // Nếu không có cả meta và total, giả định là 0
        standardResponse.meta = {
          total: 0,
          page: safeParams.page || 1,
          limit: safeParams.limit || 20
        };
      }
      
      return standardResponse;
    } catch (error: any) {
      // Nếu API trả về 404 (không có tin nhắn), trả về mảng rỗng và meta thay vì ném lỗi
      if (error.response && error.response.status === 404) {
        console.log('Không tìm thấy tin nhắn nào, trả về mảng rỗng');
        return { 
          data: [], 
          meta: { 
            total: 0,
            page: safeParams.page || 1,
            limit: safeParams.limit || 20
          } 
        };
      }
      
      // Nếu lỗi 422 (validation error), cũng trả về mảng rỗng
      if (error.response && error.response.status === 422) {
        console.log('Lỗi validation khi lấy tin nhắn, trả về mảng rỗng');
        return { 
          data: [], 
          meta: { 
            total: 0,
            page: safeParams.page || 1,
            limit: safeParams.limit || 20
          } 
        };
      }
      
      // Nếu lỗi khác, ném lỗi như bình thường
      throw error;
    }
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách tin nhắn:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Lấy danh sách cuộc trò chuyện
export const getConversations = async (page?: number, limit?: number) => {
  try {
    const params = { page, limit };
    const response = await apiClient.get('/messages/conversations', { params });
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách cuộc trò chuyện:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Đánh dấu tin nhắn đã đọc
export const markMessagesAsRead = async (senderId: number | string) => {
  try {
    // Đảm bảo senderId là số
    const numericSenderId = Number(senderId);
    if (isNaN(numericSenderId)) {
      throw new Error('senderId phải là số hợp lệ');
    }
    
    const response = await apiClient.post(`/messages/${numericSenderId}/read`);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Xóa tin nhắn
export const deleteMessage = async (messageId: string) => {
  try {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi xóa tin nhắn:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

export default apiClient; 