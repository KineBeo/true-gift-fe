import { useEffect, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import challengeService, {
  ChallengeHistoryDto,
  TodayChallengeDto,
} from "@/lib/services/challenge";
import IconOnlyButton from "@/components/ui/common/IconOnlyButton";
import IconButton from "@/components/ui/common/IconButton";
import { homeStyles } from "../home/styles/homeStyles";
import LottieView from "lottie-react-native";
import challengeStyles from "./styles/challengeStyles";
export default function ChallengeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challengeHistory, setChallengeHistory] =
    useState<ChallengeHistoryDto | null>(null);
  const [todayChallenge, setTodayChallenge] =
    useState<TodayChallengeDto | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyData, todayData] = await Promise.all([
        challengeService.getChallengeHistory(),
        challengeService.getTodayChallenge(),
      ]);

      setChallengeHistory(historyData);
      setTodayChallenge(todayData);
    } catch (error) {
      console.error("Error fetching challenge data:", error);
      Alert.alert("Error", "Failed to load challenge data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderTodaysChallengeCard = () => {
    if (!todayChallenge) return null;

    return (
      <View
        style={challengeStyles.todayChallengeCard}
        className="bg-zinc-800/80"
      >
        <View style={challengeStyles.cardHeader}>
          <Text style={challengeStyles.cardTitle}>Today's Challenge</Text>
          {todayChallenge.isCompleted ? (
            <View style={challengeStyles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={challengeStyles.completedText}>Completed</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={challengeStyles.takeButton}
              onPress={() => {}}
            >
              <Text style={challengeStyles.takeButtonText}>Take Challenge</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={challengeStyles.challengeDesc}>
          {todayChallenge.description}
        </Text>

        <View style={challengeStyles.challengeDetails}>
          <Text style={challengeStyles.challengeClass}>
            Food type: {todayChallenge.class}
          </Text>
          <Text style={challengeStyles.challengeExpiry}>
            Expires in: {getTimeRemaining(todayChallenge.expiresAt)}
          </Text>
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

    if (diffHrs < 0) return "Expired";
    if (diffHrs >= 24) {
      const days = Math.floor(diffHrs / 24);
      return `${days} day${days > 1 ? "s" : ""}`;
    }

    return `${diffHrs}h ${diffMins}m`;
  };

  if (loading) {
    return (
      <View style={challengeStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={challengeStyles.loadingText}>
          Loading challenge data...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black w-full items-center justify-center">
      <SafeAreaView style={challengeStyles.container}>
        <StatusBar style="dark" />
        <View className="w-full bg-black">
          <View
            style={challengeStyles.streakContainer}
            className="bg-zinc-900/95"
          >
            {/* Add history navigation button to top right corner */}
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(100, 100, 100, 0.5)",
                justifyContent: "center",
                zIndex: 10,
              }}
              onPress={() => router.push("/(app)/challenges/challenge-history")}
            >
              <Ionicons name="time-outline" size={20} color="#fff" />
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 14,
                  marginLeft: 5,
                }}
              >
                Detail
              </Text>
            </TouchableOpacity>
            <View style={challengeStyles.streakLeftBox}>
              <View style={challengeStyles.flameIconContainer}>
                <LottieView
                  source={require("../../../assets/challenge/fire.json")}
                  autoPlay
                  loop
                  style={challengeStyles.fireAnimation}
                />
              </View>
              <Text style={challengeStyles.streakDaysCount}>
                {challengeHistory?.currentStreak || 0} days
              </Text>
              <Text style={challengeStyles.streakDaysLabel}>streak</Text>
            </View>

            <View style={challengeStyles.streakRightContent}>
              <View style={challengeStyles.pointsContainer}>
                <Text style={challengeStyles.pointsText}>
                  {challengeHistory?.totalCompleted || 0}
                </Text>
                <Text style={challengeStyles.pointsLabel}>/ 100</Text>
              </View>

              <View style={challengeStyles.progressBarContainer}>
                <View
                  style={[
                    challengeStyles.progressBar,
                    {
                      width: `${Math.min(
                        100,
                        ((challengeHistory?.totalCompleted || 0) / 100) * 100
                      )}%`,
                    },
                  ]}
                />
              </View>

              <View style={challengeStyles.weekdayContainer}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, index) => {
                    // Check if there is a completed challenge for this day in the recent history
                    const dayOfWeek = index + 1; // 1 = Monday, 7 = Sunday
                    const today = new Date();
                    const currentDayOfWeek =
                      today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday (0) to 7

                    // Find completed challenges from the past week
                    const isCompleted = challengeHistory?.history?.some(
                      (item) => {
                        if (!item.isCompleted) return false;

                        const completedDate = new Date(
                          item.completedAt || item.createdAt
                        );
                        const completedDayOfWeek =
                          completedDate.getDay() === 0
                            ? 7
                            : completedDate.getDay();

                        // Check if it's from the current week and matches the day
                        const daysDiff = Math.floor(
                          (today.getTime() - completedDate.getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        return daysDiff < 7 && completedDayOfWeek === dayOfWeek;
                      }
                    );

                    return (
                      <View
                        key={day}
                        style={challengeStyles.dayCircle}
                        className={isCompleted ? "bg-amber-500" : "bg-zinc-700"}
                      >
                        {isCompleted && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </View>
                    );
                  }
                )}
              </View>
              <View style={challengeStyles.dayLabelsContainer}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <Text key={day} style={challengeStyles.dayLabel}>
                      {day}
                    </Text>
                  )
                )}
              </View>
            </View>
          </View>

          {/* Today's Challenge */}
          {renderTodaysChallengeCard()}
        </View>

        {/* Add Achievement Here */}
        <View
          style={challengeStyles.achievementsContainer}
          className="bg-zinc-800/80"
        >
          <View style={challengeStyles.achievementHeader}>
            <Text style={challengeStyles.achievementsTitle}>Achievements</Text>
            <Ionicons name="trophy" size={20} color="#FFB800" />
          </View>

          <ScrollView
            horizontal
            scrollEnabled={true}
            directionalLockEnabled={true}
            alwaysBounceVertical={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={challengeStyles.badgeScrollContainer}
            className="bg-zinc-800/80"
          >
            {/* First Challenge Badge */}
            <View style={challengeStyles.badgeContainer}>
              <View
                style={[
                  challengeStyles.badge,
                  challengeHistory?.achievements?.some(
                    (a) => a.id === "first-challenge"
                  )
                    ? challengeStyles.firstBadge
                    : challengeStyles.lockedBadge,
                ]}
              >
                <LottieView
                  source={require("../../../assets/challenge/first.json")}
                  autoPlay
                  loop
                  style={challengeStyles.firstBadgeAnimation}
                />
                <View
                  style={[
                    challengeStyles.badgeIconBox,
                    {
                      backgroundColor: challengeHistory?.achievements?.some(
                        (a) => a.id === "first-challenge"
                      )
                        ? "#FFB800"
                        : "#aaa",
                      top: 2,
                      right: 2,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      challengeHistory?.achievements?.some(
                        (a) => a.id === "first-challenge"
                      )
                        ? "star"
                        : "lock-closed"
                    }
                    size={12}
                    color="white"
                  />
                </View>
              </View>
              <Text
                style={[
                  challengeStyles.badgeTitle,
                  challengeHistory?.achievements?.some(
                    (a) => a.id === "first-challenge"
                  ) && { color: "#FFB800" },
                ]}
              >
                First Challenge
              </Text>
            </View>

            {/* 7-day Streak Badge */}
            <View style={challengeStyles.badgeContainer}>
              <View
                style={[
                  challengeStyles.badge,
                  challengeStyles.streakBadge,
                  challengeHistory?.achievements?.some(
                    (a) => a.id === "streak-7"
                  )
                    ? challengeStyles.badge
                    : challengeStyles.lockedBadge,
                ]}
              >
                <LottieView
                  source={require("../../../assets/challenge/iron.json")}
                  autoPlay
                  loop
                  style={challengeStyles.streakBadgeAnimation}
                />
                <Text
                  style={[
                    challengeStyles.badgeNumber,
                    {
                      color: challengeHistory?.achievements?.some(
                        (a) => a.id === "streak-7"
                      )
                        ? "white"
                        : "#aaa",
                    },
                  ]}
                >
                  7
                </Text>
                <View
                  style={[
                    challengeStyles.badgeIconBox,
                    {
                      backgroundColor: challengeHistory?.achievements?.some(
                        (a) => a.id === "streak-7"
                      )
                        ? "#E94976"
                        : "#aaa",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      challengeHistory?.achievements?.some(
                        (a) => a.id === "streak-7"
                      )
                        ? "checkmark"
                        : "lock-closed"
                    }
                    size={14}
                    color="white"
                  />
                </View>
              </View>
              <Text
                style={[
                  challengeStyles.badgeTitle,
                  challengeHistory?.achievements?.some(
                    (a) => a.id === "streak-7"
                  ) && { color: "#E94976" },
                ]}
              >
                7-Day Streak
              </Text>
            </View>

            {/* 30-day Streak Badge */}
            <View style={challengeStyles.badgeContainer}>
              <View
                style={[
                  challengeStyles.badge,
                  challengeStyles.streakBadge,
                  challengeHistory?.achievements?.some(
                    (a) => a.id === "streak-30"
                  )
                    ? challengeStyles.badge
                    : challengeStyles.lockedBadge,
                ]}
              >
                <LottieView
                  source={require("../../../assets/challenge/gold.json")}
                  autoPlay
                  loop
                  style={challengeStyles.streakBadgeAnimation}
                />
                <Text
                  style={[
                    challengeStyles.badgeNumber,
                    {
                      color: challengeHistory?.achievements?.some(
                        (a) => a.id === "streak-30"
                      )
                        ? "white"
                        : "#aaa",
                    },
                  ]}
                >
                  30
                </Text>
                <View
                  style={[
                    challengeStyles.badgeIconBox,
                    {
                      backgroundColor: challengeHistory?.achievements?.some(
                        (a) => a.id === "streak-30"
                      )
                        ? "#E94976"
                        : "#aaa",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      challengeHistory?.achievements?.some(
                        (a) => a.id === "streak-30"
                      )
                        ? "checkmark"
                        : "lock-closed"
                    }
                    size={14}
                    color="white"
                  />
                </View>
              </View>
              <Text
                style={[
                  challengeStyles.badgeTitle,
                  challengeHistory?.achievements?.some(
                    (a) => a.id === "streak-30"
                  ) && { color: "#E94976" },
                ]}
              >
                30-Day Streak
              </Text>
            </View>

            {/* Dynamic mapping for any additional achievements */}
            {challengeHistory?.achievements
              ?.filter(
                (a) =>
                  !["first-challenge", "streak-7", "streak-30"].includes(a.id)
              )
              .map((achievement) => (
                <View
                  key={achievement.id}
                  style={challengeStyles.badgeContainer}
                >
                  <View style={challengeStyles.badge}>
                    <View style={challengeStyles.badgeContent}>
                      <Text style={challengeStyles.badgeNumber}>
                        {achievement.id
                          .split("-")[1]
                          ?.charAt(0)
                          ?.toUpperCase() || "✓"}
                      </Text>
                      <View style={challengeStyles.badgeIconBox}>
                        <Ionicons name="checkmark" size={14} color="white" />
                      </View>
                    </View>
                  </View>
                  <Text style={challengeStyles.badgeTitle}>
                    {achievement.name}
                  </Text>
                </View>
              ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Friend count indicator */}
      <View className="absolute top-16 w-full flex-row justify-between px-4 m-4">
        <IconOnlyButton
          iconName="arrow-back"
          iconSize={25}
          iconColor="white"
          goBack={true}
        />

        <IconButton
          iconName="people"
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

      {/* Bottom controls */}
      <View className="flex-row w-full justify-between px-16 absolute bottom-36 items-center">
        <Pressable
          onPress={() => {}}
          className="items-center justify-center w-12 h-12"
        >
          {/* <Ionicons name={"flash"} size={35} color="#ffb800" /> */}
        </Pressable>

        {/* Capture button */}
        <Pressable
          onPress={() => {
            router.back();
          }}
          style={homeStyles.captureButton}
        >
          <View style={[homeStyles.captureButtonInner]} />
        </Pressable>

        <Pressable
          onPress={() => {}}
          className="items-center justify-center w-12 h-12"
        >
          {/* <Ionicons name="flame" size={35} color="white" /> */}
        </Pressable>
      </View>
    </View>
  );
}
