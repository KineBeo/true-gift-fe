import { apiService } from './api';
import * as FileSystem from 'expo-file-system';
import { useAuthStore } from '@/lib/stores/auth-store';
import { API_URL } from '@/lib/config/environment';

export interface FileDto {
  id: string;
  path: string;
  filename?: string;
  mimetype?: string;
  createdAt?: string;
}

export interface UploadPhotoResponse {
  file: FileDto;
  success: boolean;
  message?: string;
}

const filesService = {
  /**
   * Upload a photo from a local URI to the server
   * @param uri Local URI of the photo to upload
   * @param options Optional metadata for the upload
   * @returns Promise with the uploaded file data
   */
  uploadPhoto: async (
    uri: string, 
    options?: { 
      description?: string;
      toUserId?: number; 
      type?: 'profile' | 'message' | 'post';
    }
  ): Promise<UploadPhotoResponse> => {
    try {
      // Check if the file exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Create form data for upload
      const formData = new FormData();
      
      // Get file extension and mime type
      const uriParts = uri.split('.');
      const fileExtension = uriParts[uriParts.length - 1];
      const mimeType = fileExtension === 'jpg' || fileExtension === 'jpeg' 
        ? 'image/jpeg' 
        : fileExtension === 'png' 
          ? 'image/png'
          : 'application/octet-stream';

      // Create a file name
      const fileName = `photo_${Date.now()}.${fileExtension}`;
      
      // Append the file - ensure proper mobile format compatible with Multer/NestJS
      const fileData = {
        uri,
        name: fileName,
        type: mimeType,
      };
      
      // Create proper formdata for React Native/Expo
      formData.append('file', fileData as any);
      
      // Add debugging info
    //   console.log('Uploading file with data:', {
    //     name: fileName,
    //     type: mimeType,
    //     uri: uri.substring(0, 30) + '...' // Log trimmed URI for privacy
    //   });

      // Append metadata if provided
      if (options?.description) {
        formData.append('description', options.description);
      }
      
      if (options?.toUserId) {
        formData.append('toUserId', options.toUserId.toString());
      }
      
      if (options?.type) {
        formData.append('type', options.type);
      }

      // Get the authentication token from the store
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      // Use the photos upload endpoint to track the creator
      const endpoint = '/photos/upload';
      
      // Make the API request with fetch directly since apiService doesn't support FormData
      const baseUrl = API_URL || 'https://api.truegift.com';
      
    //   console.log(`Uploading photo to server...`);
      
      try {
        // Log the attempt to help with debugging
        // console.log(`Attempting to upload to ${baseUrl}${endpoint} with token ${token ? 'present' : 'missing'}`);
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        });
        
        if (!response.ok) {
          // Try to get more details about the error
          let errorDetails = '';
          try {
            const errorResponse = await response.json();
            errorDetails = errorResponse.message || JSON.stringify(errorResponse);
            console.log('Error response details:', errorDetails);
          } catch (e) {
            // Ignore JSON parsing errors
          }
          
          // For any error, including 400 Bad Request, try the alternative endpoint
          console.log(`Server returned error (${response.status}: ${errorDetails}). Trying alternative endpoint...`);
          
          // Try both IPFS-specific and generic file upload endpoints as fallbacks
          let fallbackEndpoints = ['/files/upload', '/api/v1/files/upload'];
          let fallbackData = null;
          
          for (const fbEndpoint of fallbackEndpoints) {
            try {
              console.log(`Trying fallback endpoint: ${fbEndpoint}`);
              
              // Create fresh FormData for each attempt
              const freshFormData = new FormData();
              freshFormData.append('file', fileData as any);
              
              if (options?.type) {
                freshFormData.append('type', options.type);
              }
              
              const fallbackResponse = await fetch(`${baseUrl}${fbEndpoint}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
                body: freshFormData
              });
              
              if (fallbackResponse.ok) {
                fallbackData = await fallbackResponse.json();
                console.log('Upload successful with fallback endpoint:', fbEndpoint);
                break; // Exit the loop on success
              } else {
                console.log(`Fallback endpoint ${fbEndpoint} failed with status: ${fallbackResponse.status}`);
              }
            } catch (fbError) {
              console.error(`Error with fallback endpoint ${fbEndpoint}:`, fbError);
            }
          }
          
          if (fallbackData) {
            return {
              success: true,
              file: {
                id: fallbackData.id || 'temp-id-' + Date.now(),
                path: fallbackData.path || '',
                filename: fileName,
                mimetype: mimeType,
              }
            };
          }
          
          // If we reach here, all fallbacks failed
          throw new Error(`Upload failed with status: ${response.status}${errorDetails ? '. ' + errorDetails : ''}`);
        }
        
        const jsonResponse = await response.json();
        
        // Create a simplified response with minimal required data
        return {
          success: true,
          file: {
            id: jsonResponse.id || 'temp-id-' + Date.now(),
            path: jsonResponse.url || jsonResponse.path || '',
            filename: fileName,
            mimetype: mimeType,
          }
        };
      } catch (networkError) {
        // Handle network errors more gracefully
        console.error('Network error during upload:', networkError);
        
        // Try to upload to files endpoint as a fallback if this seems like a network error
        try {
          console.log('Attempting fallback upload to /files/upload endpoint...');
          const fallbackResponse = await fetch(`${baseUrl}/files/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData
          });
          
          if (!fallbackResponse.ok) {
            throw new Error(`Fallback upload failed: ${fallbackResponse.status}`);
          }
          
          const fallbackData = await fallbackResponse.json();
          console.log('Fallback upload successful');
          
          return {
            success: true,
            file: {
              id: fallbackData.id || 'temp-id-' + Date.now(),
              path: fallbackData.path || '',
              filename: fileName,
              mimetype: mimeType,
            }
          };
        } catch (fallbackError) {
          throw networkError; // Throw the original error if fallback also fails
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        file: {
          id: 'error-id',
          path: '',
        }
      };
    }
  },

  /**
   * Get the full URL for a file path
   * @param path The file path from the FileDto
   * @returns Full URL to the file
   */
  getFileUrl: (path: string): string => {
    if (!path) return '';
    
    // Cache of gateway URLs - dedicated gateway for TrueGift
    const PINATA_GATEWAY = 'https://lavender-useful-yak-720.mypinata.cloud/ipfs/';
    const PINATA_FALLBACK = 'https://gateway.pinata.cloud/ipfs/';
    
    // Log for debugging
    // console.log(`Getting URL for path: ${path}`);
    
    // CASE 1: Handle direct IPFS CIDs (no slashes and follows CID format)
    const isIpfsCid = (p: string): boolean => {
      return !p.includes('/') && (
        p.startsWith('Qm') || 
        p.startsWith('bafy') || 
        p.startsWith('bafk') ||
        !!p.match(/^[a-zA-Z0-9]{46,59}$/)
      );
    };
    
    if (isIpfsCid(path)) {
    //   console.log(`🔍 Detected IPFS CID: ${path}`);
      return `${PINATA_GATEWAY}${path}`;
    }
    
    // CASE 2: Handle fallback local file paths from backend
    if (path.includes('fallback-') && path.includes('files/uploads/')) {
    //   console.log(`🔍 Detected fallback file path: ${path}`);
      // This might indicate IPFS upload failed - use the backend URL
      const baseUrl = API_URL || 'https://api.truegift.com';
      return path.startsWith('http') ? path : `${baseUrl}/${path}`;
    }
    
    // CASE 3: Handle paths with existing IPFS gateway URLs
    if (path.includes('/ipfs/')) {
    //   console.log(`🔍 Detected IPFS gateway URL: ${path}`);
      // Extract CID from path and use our dedicated gateway
      const segments = path.split('/ipfs/');
      if (segments.length > 1) {
        const cid = segments[segments.length - 1].split('?')[0]; // Remove query params if any
        // console.log(`🔍 Extracted CID: ${cid}`);
        return `${PINATA_GATEWAY}${cid}`;
      }
    }
    
    // CASE 4: Handle URLs that already use our gateway
    if (path.includes('lavender-useful-yak-720.mypinata.cloud')) {
    //   console.log(`🔍 Path already using our gateway: ${path}`);
      return path; // Already using correct gateway
    }
    
    // CASE 5: Handle other Pinata gateway URLs
    if (path.includes('gateway.pinata.cloud') || path.includes('pinata.cloud')) {
    //   console.log(`🔍 Converting Pinata URL: ${path}`);
      
      // Try to extract the CID after /ipfs/
      if (path.includes('/ipfs/')) {
        const cid = path.split('/ipfs/')[1].split('?')[0]; // Remove query params
        return `${PINATA_GATEWAY}${cid}`;
      }
    }
    
    // CASE 6: Handle normal HTTP/HTTPS URLs
    if (path.startsWith('http://') || path.startsWith('https://')) {
    //   console.log(`🔍 Using complete URL as-is: ${path}`);
      return path;
    }
    
    // CASE 7: Handle local backend paths
    // console.log(`🔍 Treating as relative path: ${path}`);
    const baseUrl = API_URL || 'https://api.truegift.com';
    
    // Clean up any double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${baseUrl}/${cleanPath}`;
  },

  /**
   * Get photos for the currently logged in user
   * @param page Page number (starting from 1)
   * @param limit Number of items per page
   * @returns Promise with the user's photos
   */
  getMyPhotos: async (page = 1, limit = 10): Promise<any> => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const baseUrl = API_URL || 'https://api.truegift.com';
      
      try {
        const response = await fetch(`${baseUrl}/photos/me?page=${page}&limit=${limit}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch photos: ${response.status}`);
        }

        const jsonResponse = await response.json();
        
        // Handle any kind of API response format
        let formattedData = [];
        
        if (Array.isArray(jsonResponse)) {
          formattedData = jsonResponse;
        } else if (jsonResponse.data && Array.isArray(jsonResponse.data)) {
          formattedData = jsonResponse.data;
        } else if (jsonResponse.items && Array.isArray(jsonResponse.items)) {
          formattedData = jsonResponse.items;
        } else if (jsonResponse.results && Array.isArray(jsonResponse.results)) {
          formattedData = jsonResponse.results;
        }
        
        // Return in a consistent format
        return {
          data: formattedData.map((item: any) => ({
            id: item.id || item._id || item.fileId || 'unknown',
            path: item.url || item.path || '',
            filename: item.filename || 'photo.jpg',
            mimetype: item.mimetype || 'image/jpeg',
            createdAt: item.createdAt || new Date().toISOString()
          }))
        };
      } catch (error) {
        // Try fallback to files endpoint if photos endpoint fails
        console.log('Falling back to files endpoint for photo history');
        const fallbackResponse = await fetch(`${baseUrl}/files`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Failed to fetch files: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        
        // Process fallback data
        let filesData = [];
        if (Array.isArray(fallbackData)) {
          filesData = fallbackData;
        } else if (fallbackData.data && Array.isArray(fallbackData.data)) {
          filesData = fallbackData.data;
        }
        
        return {
          data: filesData.map((item: any) => ({
            id: item.id || 'unknown',
            path: item.path || '',
            filename: item.filename || 'file.jpg',
            mimetype: item.mimetype || 'image/jpeg',
            createdAt: item.createdAt || new Date().toISOString()
          }))
        };
      }
    } catch (error) {
      console.error('Error fetching photo history:', error);
      return { data: [] };
    }
  },

  /**
   * Get photos from a specific friend
   * @param friendId The ID of the friend
   * @param page Page number (starting from 1)
   * @param limit Number of items per page
   * @returns Promise with the friend's photos
   */
  getFriendPhotos: async (friendId: number, page = 1, limit = 10): Promise<any> => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const baseUrl = API_URL || 'https://api.truegift.com';
      
      const response = await fetch(`${baseUrl}/photos/friends/${friendId}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch friend's photos: ${response.status}`);
      }

      const jsonResponse = await response.json();
      
      // Handle any kind of API response format
      let formattedData = [];
      
      if (Array.isArray(jsonResponse)) {
        formattedData = jsonResponse;
      } else if (jsonResponse.data && Array.isArray(jsonResponse.data)) {
        formattedData = jsonResponse.data;
      } else if (jsonResponse.items && Array.isArray(jsonResponse.items)) {
        formattedData = jsonResponse.items;
      } else if (jsonResponse.results && Array.isArray(jsonResponse.results)) {
        formattedData = jsonResponse.results;
      }
      
      // Return in a consistent format
      return {
        data: formattedData.map((item: any) => ({
          id: item.id || item._id || item.fileId || 'unknown',
          path: item.url || item.path || '',
          filename: item.filename || 'photo.jpg',
          mimetype: item.mimetype || 'image/jpeg',
          createdAt: item.createdAt || new Date().toISOString()
        }))
      };
    } catch (error) {
      console.error(`Error fetching friend's photos (ID: ${friendId}):`, error);
      return { data: [] };
    }
  },
  
  /**
   * Get photos from all friends of the current user
   * @param page Page number (starting from 1)
   * @param limit Number of items per page
   * @returns Promise with all friends' photos
   */
  getAllFriendsPhotos: async (page = 1, limit = 20): Promise<any> => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const baseUrl = API_URL || 'https://api.truegift.com';
      
      const response = await fetch(`${baseUrl}/photos/friends?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch friends' photos: ${response.status}`);
      }

      const jsonResponse = await response.json();
      
      // Handle any kind of API response format
      let formattedData = [];
      
      if (Array.isArray(jsonResponse)) {
        formattedData = jsonResponse;
      } else if (jsonResponse.data && Array.isArray(jsonResponse.data)) {
        formattedData = jsonResponse.data;
      } else if (jsonResponse.items && Array.isArray(jsonResponse.items)) {
        formattedData = jsonResponse.items;
      } else if (jsonResponse.results && Array.isArray(jsonResponse.results)) {
        formattedData = jsonResponse.results;
      }
      
      // Return in a consistent format
      return {
        data: formattedData.map((item: any) => ({
          id: item.id || item._id || item.fileId || 'unknown',
          path: item.url || item.path || '',
          filename: item.filename || 'photo.jpg',
          mimetype: item.mimetype || 'image/jpeg',
          createdAt: item.createdAt || new Date().toISOString(),
          userId: item.userId || item.user?.id || null, // Include the user ID to identify the friend
          userName: item.userName || 
            (item.user ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() : null)
        }))
      };
    } catch (error) {
      console.error('Error fetching friends\' photos:', error);
      return { data: [] };
    }
  }
};

export default filesService; 