import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRouter } from "expo-router";
import challengeService, {
  ChallengeHistoryDto,
  ChallengeHistoryItem,
} from "@/lib/services/challenge";
import challengeStyles from "./styles/challengeStyles";
import IconOnlyButton from "@/components/ui/common/IconOnlyButton";
import IconButton from "@/components/ui/common/IconButton";
export default function ChallengeHistory() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challengeHistory, setChallengeHistory] =
    useState<ChallengeHistoryDto | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const historyData = await challengeService.getChallengeHistory();
      setChallengeHistory(historyData);
    } catch (error) {
      console.error("Error fetching challenge history data:", error);
      Alert.alert("Error", "Failed to load challenge history data");
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

  const renderHistoryItem = ({ item }: { item: ChallengeHistoryItem }) => {
    const date = new Date(item.createdAt);
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return (
      <View 
        style={challengeStyles.historyItem} 
        className="bg-zinc-800/80"
      >
        <View style={challengeStyles.historyItemContent}>
          <View style={challengeStyles.historyItemHeader}>
            <Text style={challengeStyles.historyItemDate}>
              {formattedDate}
            </Text>
            {item.isCompleted ? (
              <View style={challengeStyles.historyCompletedBadge}>
                <Text style={challengeStyles.historyCompletedText}>
                  Completed
                </Text>
              </View>
            ) : (
              <View style={challengeStyles.historyMissedBadge}>
                <Text style={challengeStyles.historyMissedText}>
                  Missed
                </Text>
              </View>
            )}
          </View>

          <Text style={challengeStyles.historyItemDesc}>
            {item.description}
          </Text>

          <View style={challengeStyles.historyItemDetails}>
            <Text style={challengeStyles.historyItemClass}>
              Food: {item.class}
            </Text>
            {item.isCompleted && item.score && (
              <Text style={challengeStyles.historyItemScore}>
                Score: {Math.round(item.score)}%
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={challengeStyles.loadingContainer}>
        <ActivityIndicator size="large" color="orange" />
        <Text style={challengeStyles.loadingText}>
          Loading challenge history...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black items-center justify-center">
      <StatusBar style="light" />
      
      {/* Navigation Icons */}
      <View className="absolute top-16 w-full flex-row justify-between px-4 m-4 z-10">
        <IconOnlyButton
          iconName="arrow-back"
          iconSize={25}
          iconColor="white"
          goBack={true}
        />

        <IconButton
          iconName="trophy"
          iconSize={25}
          iconColor="white"
          label="Challenges"
        />
        
        <IconOnlyButton
          iconName="chatbubble"
          iconSize={25}
          iconColor="white"
          routePath="/message"
        />
      </View>
      
      <SafeAreaView 
        style={{
          flex: 1,
          width: "100%",
          marginTop: 130,
        }}
      >
        <FlatList
          data={challengeHistory?.history || []}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          ListEmptyComponent={
            <View style={challengeStyles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color="#666" />
              <Text style={challengeStyles.emptyText}>No challenge history yet</Text>
              <Text style={challengeStyles.emptySubtext}>
                Complete your first challenge to start your streak!
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="black"
              colors={["black"]}
              progressBackgroundColor="black"
            />
          }
          contentContainerStyle={challengeStyles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}