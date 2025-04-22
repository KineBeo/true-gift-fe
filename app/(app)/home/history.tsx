import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator, 
  RefreshControl,
  StatusBar as RNStatusBar,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import Feather from '@expo/vector-icons/Feather';
import filesService, { FileDto } from '@/lib/services/files';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 3;
const NUM_COLUMNS = 3;
const PHOTO_SIZE = (SCREEN_WIDTH - (GRID_SPACING * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

// Helper function to detect IPFS-stored images
const isIPFSImage = (path: string): boolean => {
  if (!path) return false;
  
  // Check for direct IPFS CID format (no slashes and starts with typical IPFS prefixes)
  if (!path.includes('/') && (
    path.startsWith('Qm') || 
    path.startsWith('bafy') || 
    path.startsWith('bafk') ||
    !!path.match(/^[a-zA-Z0-9]{46,59}$/)
  )) {
    return true;
  }
  
  // Check for URLs containing IPFS gateways
  if (path.includes('/ipfs/') || 
      path.includes('gateway.pinata.cloud') ||
      path.includes('mypinata.cloud')) {
    return true;
  }
  
  return false;
};

// Extend FileDto to include user information for friend photos
interface ExtendedFileDto extends FileDto {
  userId?: number | null;
  userName?: string | null;
}

export default function History() {
  const router = useRouter();
  const [photos, setPhotos] = useState<ExtendedFileDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [loadingFriendPhotos, setLoadingFriendPhotos] = useState(false);

  useEffect(() => {
    console.log("🔄 History component mounted - fetching photos");
    fetchAllPhotos();
  }, []);

  const fetchMyPhotos = async (): Promise<ExtendedFileDto[]> => {
    console.log("📸 Fetching my photos...");
    try {
      const response = await filesService.getMyPhotos();
      console.log("✅ My photos response:", {
        count: response?.data?.length || 0,
        success: !!response?.data,
        sample: response?.data?.slice(0, 2) || []
      });
      
      if (response && response.data) {
        const myPhotos = response.data.map((photo: FileDto) => ({
          ...photo,
          userId: null, // Mark as my own photo
          userName: null,
        }));
        console.log(`📸 Fetched ${myPhotos.length} of my photos`);
        return myPhotos;
      }
      return [];
    } catch (error) {
      console.error("❌ Error fetching my photos:", error);
      return [];
    }
  };

  const fetchFriendsPhotos = async (): Promise<ExtendedFileDto[]> => {
    console.log("👥 Fetching friends' photos...");
    try {
      setLoadingFriendPhotos(true);
      const response = await filesService.getAllFriendsPhotos();
      
      if (response && response.data) {
        console.log("✅ Friends photos API response:", {
          count: response.data.length,
          hasFriendData: response.data.some((photo: ExtendedFileDto) => photo.userId && photo.userName),
          userIds: response.data.map((photo: ExtendedFileDto) => photo.userId).filter(Boolean),
          userNames: response.data.map((photo: ExtendedFileDto) => photo.userName).filter(Boolean),
          sample: response.data.slice(0, 2)
        });
        
        // Check for photos with missing user info
        const missingUserInfo = response.data.filter((photo: ExtendedFileDto) => photo.userId && !photo.userName);
        if (missingUserInfo.length > 0) {
          console.warn("⚠️ Some photos have userId but missing userName:", missingUserInfo.length);
        }
        
        // The getAllFriendsPhotos already includes user information, no need for additional processing
        return response.data;
      }
      console.warn("⚠️ No friends photos data returned");
      return [];
    } catch (error) {
      console.error("❌ Error fetching friend photos:", error);
      return [];
    } finally {
      setLoadingFriendPhotos(false);
    }
  };

  const fetchAllPhotos = async () => {
    try {
      console.log("🔍 Starting to fetch all photos...");
      setLoadingPhotos(true);
      
      // Fetch user's own photos
      const myPhotosPromise = fetchMyPhotos();
      // Fetch all friends' photos
      const friendsPhotosPromise = fetchFriendsPhotos();
      
      console.log("⏳ Waiting for both API requests to complete...");
      // Wait for both requests to complete
      const [myPhotos, friendPhotos] = await Promise.all([myPhotosPromise, friendsPhotosPromise]);
      
      console.log("📊 Photos fetch statistics:", {
        myPhotosCount: myPhotos.length,
        friendPhotosCount: friendPhotos.length,
      });
      
      // Combine and sort all photos by date (newest first)
      const allPhotos = [...myPhotos, ...friendPhotos];
      
      // Debug logging to identify any photos with invalid dates
      const invalidDates = allPhotos.filter((p: ExtendedFileDto) => !p.createdAt || new Date(p.createdAt).toString() === 'Invalid Date');
      if (invalidDates.length > 0) {
        console.warn("⚠️ Found photos with invalid dates:", invalidDates.length);
        console.log("First invalid photo:", invalidDates[0]);
      }
      
      allPhotos.sort((a: ExtendedFileDto, b: ExtendedFileDto) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });

      console.log("🏁 All photos sorted by date (newest first):", {
        totalCount: allPhotos.length,
        newestDate: allPhotos.length > 0 ? allPhotos[0].createdAt : 'none',
        oldestDate: allPhotos.length > 0 ? allPhotos[allPhotos.length - 1].createdAt : 'none',
        ipfsCount: allPhotos.filter((p: ExtendedFileDto) => isIPFSImage(p.path)).length,
        friendPhotosCount: allPhotos.filter((p: ExtendedFileDto) => p.userId && p.userName).length
      });

      setPhotos(allPhotos);
    } catch (error) {
      console.error("❌ Error fetching all photos:", error);
      Alert.alert("Error", "Failed to load photos");
    } finally {
      setLoadingPhotos(false);
      console.log("🏁 Finished fetching photos");
    }
  };

  const onRefresh = useCallback(async () => {
    console.log("🔄 Refreshing photos...");
    setRefreshing(true);
    await fetchAllPhotos();
    setRefreshing(false);
  }, []);

  const viewPhotoDetail = (photo: ExtendedFileDto) => {
    console.log("👁️ Viewing photo detail:", {
      id: photo.id, 
      isIpfs: isIPFSImage(photo.path),
      userId: photo.userId,
      userName: photo.userName
    });
    
    router.push({
      pathname: "/home/photo-detail",
      params: { photo: JSON.stringify(photo) }
    });
  };

  const renderPhotoItem = ({ item }: { item: ExtendedFileDto }) => {
    // Get the image URL, handling both IPFS and local files
    const imageUrl = filesService.getFileUrl(item.path);
    const isIpfs = isIPFSImage(item.path);
    
    // For debugging, log a sample of the rendered photos (avoid flooding console)
    if (Math.random() < 0.1) { // Only log ~10% of photos
      console.log("🖼️ Rendering photo:", {
        id: item.id,
        path: item.path.substring(0, 30) + (item.path.length > 30 ? '...' : ''),
        isIpfs,
        imageUrl: imageUrl.substring(0, 30) + (imageUrl.length > 30 ? '...' : ''),
        hasFriendInfo: !!(item.userId && item.userName),
        userName: item.userName
      });
    }
    
    return (
      <TouchableOpacity 
        style={styles.photoItem} 
        onPress={() => viewPhotoDetail(item)}
        activeOpacity={0.8}
      >
        {failedImages[item.id] ? (
          <View style={[styles.thumbnail, styles.fallbackContainer]}>
            <Feather name="image" size={24} color="#999" />
            <Text style={styles.fallbackText}>Image</Text>
          </View>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
            // Use different cache policy for IPFS images
            cachePolicy={isIpfs ? "memory-disk" : "memory"}
            onError={(error) => {
              console.log(`❌ Failed to load image: ${item.id}, URL: ${imageUrl}`);
              setFailedImages(prev => ({ ...prev, [item.id]: true }));
            }}
          />
        )}
        {isIpfs && (
          <View style={styles.ipfsBadge}>
            <Text style={styles.ipfsBadgeText}>IPFS</Text>
          </View>
        )}
        {item.userId && item.userName && (
          <View style={styles.usernameBadge}>
            <Text style={styles.usernameText}>{item.userName}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {loadingPhotos && photos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFB800" />
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPhotoItem}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.photoGrid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFB800"
              colors={["#FFB800"]}
            />
          }
          ListHeaderComponent={
            loadingFriendPhotos ? (
              <View style={styles.friendsLoadingContainer}>
                <ActivityIndicator size="small" color="#FFB800" />
                <Text style={styles.loadingText}>Loading friends' photos...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="camera-off" size={48} color="#999" />
              <Text style={styles.emptyText}>No photos found</Text>
              <Text style={styles.emptySubtext}>Photos you and your friends take will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  photoGrid: {
    padding: GRID_SPACING,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: GRID_SPACING,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendsLoadingContainer: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  ipfsBadge: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: 'rgba(0, 102, 204, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ipfsBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  usernameBadge: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  usernameText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fallbackContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#999',
    fontSize: 10,
    marginTop: 4,
  },
}); 