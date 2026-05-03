import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useGame } from "@/context/GameContext";
import StatCard from "@/components/StatCard";

export default function HomeScreen() {
  const c = colors.light;
  const insets = useSafeAreaInsets();
  const { stats } = useGame();
  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;

  const accuracy =
    stats.totalAnswers > 0
      ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100)
      : 0;

  const handleQuickPlay = () => {
    router.push({ pathname: "/quiz", params: { mode: "random" } });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.appName}>Bible Champion</Text>
        </View>
        <View style={styles.streakBadge}>
          <Feather name="zap" size={14} color={c.primary} />
          <Text style={styles.streakText}>{stats.currentStreak}</Text>
        </View>
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Ready to test your{"\n"}Bible knowledge?</Text>
          <Text style={styles.heroSubtitle}>
            {stats.gamesPlayed === 0
              ? "Begin your journey as a Bible Champion"
              : `${stats.gamesPlayed} quizzes completed · ${accuracy}% accuracy`}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.heroBtn, pressed && { opacity: 0.85 }]}
            onPress={handleQuickPlay}
          >
            <Feather name="play" size={16} color={c.primaryForeground} />
            <Text style={styles.heroBtnText}>Quick Play</Text>
          </Pressable>
        </View>
        <View style={styles.heroGlow} />
      </View>

      {/* Stats Row */}
      <Text style={styles.sectionTitle}>Your Stats</Text>
      <View style={styles.statsRow}>
        <StatCard
          label="Total Score"
          value={stats.totalScore.toLocaleString()}
          icon="star"
          color={c.primary}
        />
        <StatCard
          label="Best Streak"
          value={stats.bestStreak}
          icon="zap"
          color="#8E44AD"
        />
        <StatCard
          label="Accuracy"
          value={`${accuracy}%`}
          icon="target"
          color={c.correct}
        />
      </View>

      {/* Achievements */}
      {stats.achievements.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.achievementsRow}
          >
            {stats.achievements.slice(-5).map((ach) => (
              <View key={ach.id} style={styles.achievementCard}>
                <Feather name={ach.icon as any} size={24} color={c.primary} />
                <Text style={styles.achTitle}>{ach.title}</Text>
                <Text style={styles.achDesc}>{ach.description}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {/* Play by Category CTA */}
      <Pressable
        style={({ pressed }) => [styles.categoryBtn, pressed && { opacity: 0.8 }]}
        onPress={() => router.push("/(tabs)/play")}
      >
        <View style={styles.categoryBtnLeft}>
          <Feather name="grid" size={18} color={c.secondary} />
          <Text style={styles.categoryBtnText}>Play by Category</Text>
        </View>
        <Feather name="arrow-right" size={18} color={c.mutedForeground} />
      </Pressable>

      <View style={{ height: Platform.OS === "web" ? 100 : 80 }} />
    </ScrollView>
  );
}

const c = colors.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    color: c.mutedForeground,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  appName: {
    color: c.foreground,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: c.primary + "22",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: c.primary + "44",
  },
  streakText: {
    color: c.primary,
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },

  heroCard: {
    backgroundColor: c.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: c.border,
    overflow: "hidden",
  },
  heroContent: { position: "relative", zIndex: 1 },
  heroTitle: {
    color: c.foreground,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 30,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: c.mutedForeground,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.primary,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignSelf: "flex-start",
  },
  heroBtnText: {
    color: c.primaryForeground,
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  heroGlow: {
    position: "absolute",
    right: -20,
    top: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: c.primary,
    opacity: 0.06,
  },

  sectionTitle: {
    color: c.foreground,
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },

  achievementsRow: {
    marginBottom: 24,
  },
  achievementCard: {
    backgroundColor: c.card,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    width: 120,
    marginRight: 10,
    borderWidth: 1,
    borderColor: c.primary + "44",
  },
  achTitle: {
    color: c.foreground,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  achDesc: {
    color: c.mutedForeground,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: c.border,
  },
  categoryBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryBtnText: {
    color: c.foreground,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
