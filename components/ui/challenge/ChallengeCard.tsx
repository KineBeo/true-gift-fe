import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { challengeCardStyles } from "../styles/challengeCardStyles";
import { TodayChallengeDto } from "@/lib/services/challenge";

interface ChallengeCardProps {
  challenge?: TodayChallengeDto | null;
  loading?: boolean;
}

export default function ChallengeCard({ challenge, loading = false }: ChallengeCardProps) {
  const router = useRouter();

  if (loading) {
    return (
      <View style={challengeCardStyles.container} className="m-4">
        <View style={challengeCardStyles.challengeCard}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={{ textAlign: 'center', marginTop: 10 }}>Loading today's challenge...</Text>
        </View>
      </View>
    );
  }

  if (!challenge) {
    return null; // Don't render anything if there's no challenge
  }

  // If the challenge is already completed, don't show the card
  if (challenge.isCompleted) {
    return null;
  }

  return (
    <View style={challengeCardStyles.container} className="m-4">
      {/* Challenge Card */}
      <View style={challengeCardStyles.challengeCard}>
        <View style={challengeCardStyles.challengeHeader}>
          <Text style={challengeCardStyles.challengeTitle}>{challenge.title || "Today's challenge"}</Text>
          <View style={challengeCardStyles.streakRow}>
            <Ionicons
              name="flame"
              size={18}
              color="#FFB800"
            />
            <Text style={challengeCardStyles.streakText}>{challenge.currentStreak || 0}</Text>
          </View>
        </View>
        <Text style={challengeCardStyles.challengeDesc}>{challenge.description}</Text>
        <Pressable
          style={challengeCardStyles.finishBtn}
          onPress={() => router.push('/(app)/challenges')}
        >
          <Text style={challengeCardStyles.finishBtnText}>Take Challenge</Text>
        </Pressable>
      </View>

      {/* Message input row (placeholder) */}
      {/* <View style={challengeCardStyles.messageRow}>
        <Text style={challengeCardStyles.messageInput}>Send message...</Text>
        <Text style={challengeCardStyles.emojiRow}>❤️🔥😊🙂</Text>
      </View> */}
    </View>
  );
}

