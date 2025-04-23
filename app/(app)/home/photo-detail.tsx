import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Linking,
  useWindowDimensions,
  Platform,
  StatusBar as RNStatusBar
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import filesService, { FileDto } from '@/lib/services/files';

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

export default function PhotoDetail() {
  const params = useLocalSearchParams();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const [photo, setPhoto] = useState<FileDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("📋 PhotoDetail - Received params:", params);
    if (params.photo) {
      try {
        const photoData = JSON.parse(params.photo as string) as FileDto;
        console.log("✅ PhotoDetail - Successfully parsed photo data:", {
          id: photoData.id,
          path: photoData.path,
          filename: photoData.filename,
          mimetype: photoData.mimetype,
          createdAt: photoData.createdAt,
        });
        setPhoto(photoData);
      } catch (e) {
        console.error("❌ PhotoDetail - Error parsing photo data:", e);
        setError('Failed to parse photo data');
      }
    } else {
      console.warn("⚠️ PhotoDetail - No photo param found in navigation params");
    }
  }, [params.photo]);

  if (error) {
    console.log("🚫 PhotoDetail - Rendering error state:", error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!photo) {
    console.log("⏳ PhotoDetail - Rendering loading state");
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading photo...</Text>
      </View>
    );
  }

  const imageUrl = filesService.getFileUrl(photo.path);
  const isIpfs = isIPFSImage(photo.path);
  
  console.log("🖼️ PhotoDetail - Rendering photo:", {
    id: photo.id,
    path: photo.path,
    resolvedUrl: imageUrl,
    isIpfs: isIpfs,
    dimensions: { width: width * 0.9, height: width * 0.9 }
  });
  
  // Format date nicely
  const formattedDate = photo.createdAt 
    ? new Date(photo.createdAt).toLocaleDateString(undefined, {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Recent photo';
  
  // Helper to open IPFS gateway in browser
  const openIpfsGateway = () => {
    if (isIpfs) {
      // Extract just the CID if it's a full URL
      let cid = photo.path;
      if (cid.includes('/ipfs/')) {
        cid = cid.split('/ipfs/')[1];
      }
      
      // Create a shareable link to the Pinata gateway
      const shareUrl = `https://lavender-useful-yak-720.mypinata.cloud/ipfs/${cid}`;
      
      console.log("🔗 PhotoDetail - Opening IPFS URL in browser:", shareUrl);
      
      // Open the URL
      Linking.openURL(shareUrl).catch((err) => {
        console.error('❌ Error opening URL:', err);
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.contentContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: width * 0.9, height: width * 0.9 }]}
          contentFit="contain"
          cachePolicy={isIpfs ? "memory-disk" : "memory"}
          onLoad={() => {
            console.log("✅ PhotoDetail - Image loaded successfully:", {
              id: photo?.id,
              url: imageUrl.substring(0, 30) + (imageUrl.length > 30 ? '...' : '')
            });
          }}
          onError={(error) => {
            console.error('❌ PhotoDetail - Error loading image:', {
              error,
              id: photo?.id,
              url: imageUrl,
              isIpfs
            });
            setError('Failed to load image');
          }}
        />
        
        <View style={styles.infoContainer}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          
          {photo.filename && (
            <Text style={styles.filenameText}>{photo.filename}</Text>
          )}
          
          {isIpfs ? (
            <TouchableOpacity 
              style={styles.ipfsInfoBadge}
              onPress={openIpfsGateway}
            >
              <View style={styles.ipfsHeaderRow}>
                <MaterialIcons name="cloud-done" size={16} color="#fff" />
                <Text style={styles.ipfsInfoText}>Stored on IPFS</Text>
              </View>
              <Text style={styles.ipfsCidText}>
                {photo.path.length > 30 
                  ? `${photo.path.substring(0, 12)}...${photo.path.substring(photo.path.length - 8)}`
                  : photo.path
                }
              </Text>
              <Text style={styles.ipfsLinkText}>Tap to view in browser</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.localStorageBadge}>
              <View style={styles.storageHeaderRow}>
                <Feather name="hard-drive" size={16} color="#fff" />
                <Text style={styles.storageInfoText}>Stored locally</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 16,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#FFB800',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  image: {
    borderRadius: 12,
  },
  infoContainer: {
    width: '90%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  filenameText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  ipfsInfoBadge: {
    backgroundColor: 'rgba(0, 102, 204, 0.7)',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  ipfsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ipfsInfoText: {
    color: 'white',
    fontWeight: 'bold',
  },
  ipfsCidText: {
    color: '#eee',
    fontSize: 12,
    marginTop: 4,
  },
  ipfsLinkText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  localStorageBadge: {
    backgroundColor: 'rgba(80, 80, 80, 0.7)',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  storageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storageInfoText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 