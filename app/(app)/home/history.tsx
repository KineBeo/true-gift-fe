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

export default function History() {
  const router = useRouter();
  const [myPhotos, setMyPhotos] = useState<FileDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchMyPhotos();
  }, []);

  const fetchMyPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const response = await filesService.getMyPhotos();
      if (response && response.data) {
        setMyPhotos(response.data);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyPhotos();
    setRefreshing(false);
  }, []);

  const viewPhotoDetail = (photo: FileDto) => {
    router.push({
      pathname: "/home/photo-detail",
      params: { photo: JSON.stringify(photo) }
    });
  };

  const renderPhotoItem = ({ item }: { item: FileDto }) => {
    // Get the image URL, handling both IPFS and local files
    const imageUrl = filesService.getFileUrl(item.path);
    const isIpfs = isIPFSImage(item.path);
    
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
              console.log(`Failed to load image: ${item.id}, URL: ${imageUrl}`);
              setFailedImages(prev => ({ ...prev, [item.id]: true }));
            }}
          />
        )}
        {isIpfs && (
          <View style={styles.ipfsBadge}>
            <Text style={styles.ipfsBadgeText}>IPFS</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {loadingPhotos && myPhotos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFB800" />
        </View>
      ) : (
        <FlatList
          data={myPhotos}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="camera-off" size={48} color="#999" />
              <Text style={styles.emptyText}>No photos found</Text>
              <Text style={styles.emptySubtext}>Photos you take will appear here</Text>
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