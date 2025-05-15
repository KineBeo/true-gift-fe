import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/environment';
import { useAuthStore } from '../stores/auth-store';

// Các kiểu filter được hỗ trợ
export type FilterType =
  | 'grayscale' | 'sepia' | 'blur' | 'contour' | 'sharpen'
  | 'edge_enhance' | 'emboss' | 'find_edges' | 'brightness'
  | 'contrast' | 'saturation' | 'vintage' | 'negative'
  | 'solarize' | 'posterize' | 'vignette' | 'sketch'
  | 'watercolor' | 'oil_painting';

export interface FilterDescription {
  [key: string]: string;
}

class ImageFilterService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.EXPO_PUBLIC_IMAGE_FILTER_SERVICE,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Gửi ảnh và filter đến server để xử lý
   * @param imageUri URI nội bộ của ảnh (phải bắt đầu bằng file://)
   * @param filterName Tên filter
   * @param strength Mức độ áp dụng filter (0.0 - 2.0)
   * @returns Blob ảnh đã được xử lý
   */
  async applyFilter(
    imageUri: string,
    filterName: FilterType,
    strength: number = 1.0
  ): Promise<Blob> {
    try {
      if (!imageUri.startsWith('file://')) {
        throw new Error('imageUri must start with "file://"');
      }

      const formData = new FormData();

      // Tạo đối tượng file cho React Native
      const fileToUpload = {
        uri: imageUri,
        name: 'image.jpg',
        type: 'image/jpeg',
      };

      formData.append('file', fileToUpload as any);
      formData.append('filter_name', filterName);
      formData.append('strength', strength.toString());

      const response = await this.api.post('/image/filter', formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Error applying filter:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Lấy danh sách filter có sẵn
   */
  async getAvailableFilters(): Promise<FilterDescription> {
    try {
      const response = await this.api.get('/image/filters');
      return response.data.available_filters;
    } catch (error) {
      console.error('❌ Error getting available filters:', error);
      throw error;
    }
  }

  /**
   * Lấy ảnh preview của filter
   */
  async getFilterPreview(
    filterName: FilterType,
    strength: number = 1.0
  ): Promise<Blob> {
    try {
      const response = await this.api.get(`/image/filter/preview/${filterName}`, {
        params: { strength },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error getting filter preview:', error);
      throw error;
    }
  }
}

export const imageFilterService = new ImageFilterService();
