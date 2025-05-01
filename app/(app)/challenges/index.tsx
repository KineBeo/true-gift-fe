import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  RefreshControl,
  Image,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '@/lib/stores/auth-store';
import challengeService, { 
  ChallengeHistoryDto, 
  ChallengeHistoryItem, 
  TodayChallengeDto 
} from '@/lib/services/challenge';

export default function ChallengeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challengeHistory, setChallengeHistory] = useState<ChallengeHistoryDto | null>(null);
  const [todayChallenge, setTodayChallenge] = useState<TodayChallengeDto | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyData, todayData] = await Promise.all([
        challengeService.getChallengeHistory(),
        challengeService.getTodayChallenge()
      ]);
      
      setChallengeHistory(historyData);
      setTodayChallenge(todayData);
    } catch (error) {
      console.error('Error fetching challenge data:', error);
      Alert.alert('Error', 'Failed to load challenge data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderTodaysChallengeCard = () => {
    if (!todayChallenge) return null;

    return (
      <View style={styles.todayChallengeCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Challenge</Text>
          {todayChallenge.isCompleted ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.takeButton}
              onPress={() => router.push('/challenges/submit')}
            >
              <Text style={styles.takeButtonText}>Take Challenge</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.challengeDesc}>{todayChallenge.description}</Text>
        
        <View style={styles.challengeDetails}>
          <Text style={styles.challengeClass}>Food type: {todayChallenge.class}</Text>
          <Text style={styles.challengeExpiry}>
            Expires in: {getTimeRemaining(todayChallenge.expiresAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: ChallengeHistoryItem }) => {
    const date = new Date(item.createdAt);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return (
      <View style={styles.historyItem}>
        <View style={styles.historyItemContent}>
          <View style={styles.historyItemHeader}>
            <Text style={styles.historyItemDate}>{formattedDate}</Text>
            {item.isCompleted ? (
              <View style={styles.historyCompletedBadge}>
                <Text style={styles.historyCompletedText}>Completed</Text>
              </View>
            ) : (
              <View style={styles.historyMissedBadge}>
                <Text style={styles.historyMissedText}>Missed</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.historyItemDesc}>{item.description}</Text>
          
          <View style={styles.historyItemDetails}>
            <Text style={styles.historyItemClass}>Food: {item.class}</Text>
            {item.isCompleted && item.score && (
              <Text style={styles.historyItemScore}>Score: {Math.round(item.score)}%</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const getTimeRemaining = (expiryDateStr: string) => {
    const expiryDate = new Date(expiryDateStr);
    const now = new Date();
    
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs < 0) return 'Expired';
    if (diffHrs >= 24) {
      const days = Math.floor(diffHrs / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    
    return `${diffHrs}h ${diffMins}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading challenge data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Photo Challenges</Text>
        <TouchableOpacity 
          style={styles.newChallengeButton}
          onPress={() => router.push('/challenges/submit')}
        >
          <Ionicons name="camera" size={22} color="white" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={challengeHistory?.history || []}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        ListHeaderComponent={
          <>
            {/* Streak Info */}
            <View style={styles.streakContainer}>
              <View style={styles.streakBox}>
                <Ionicons name="flame" size={28} color="#FFB800" />
                <Text style={styles.streakCount}>{challengeHistory?.currentStreak || 0}</Text>
                <Text style={styles.streakLabel}>Current Streak</Text>
              </View>
              
              <View style={styles.streakBox}>
                <Ionicons name="trophy" size={28} color="#FFB800" />
                <Text style={styles.streakCount}>{challengeHistory?.highestStreak || 0}</Text>
                <Text style={styles.streakLabel}>Best Streak</Text>
              </View>
              
              <View style={styles.streakBox}>
                <Ionicons name="checkmark-circle" size={28} color="#28a745" />
                <Text style={styles.streakCount}>{challengeHistory?.totalCompleted || 0}</Text>
                <Text style={styles.streakLabel}>Completed</Text>
              </View>
            </View>
            
            {/* Today's Challenge */}
            {renderTodaysChallengeCard()}
            
            {/* History Header */}
            <View style={styles.historyHeader}>
              <Text style={styles.historyHeaderText}>Challenge History</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No challenge history yet</Text>
            <Text style={styles.emptySubtext}>Complete your first challenge to start your streak!</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  newChallengeButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  streakBox: {
    alignItems: 'center',
    flex: 1,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#333',
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  todayChallengeCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  completedText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 12,
  },
  takeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  takeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  challengeDesc: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  challengeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeClass: {
    fontSize: 14,
    color: '#666',
  },
  challengeExpiry: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  historyHeader: {
    marginHorizontal: 15,
    marginTop: 25,
    marginBottom: 5,
  },
  historyHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  historyItem: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  historyItemContent: {
    padding: 15,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  historyCompletedBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyCompletedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyMissedBadge: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyMissedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyItemDesc: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  historyItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyItemClass: {
    fontSize: 14,
    color: '#666',
  },
  historyItemScore: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});