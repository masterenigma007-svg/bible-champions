import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatCard from "@/components/StatCard";
import ScreenBackground from "@/components/ScreenBackground";
import colors from "@/constants/colors";
import { CATEGORIES } from "@/constants/questions";
import { useGame } from "@/context/GameContext";

export default function ProfileScreen() {
  const c = colors.light;
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const { stats, resetStats } = useGame();

  const accuracy =
    stats.totalAnswers > 0
      ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100)
      : 0;

  const handleReset = () => {
    Alert.alert(
      "Reset Progress",
      "Are you sure you want to reset all your stats? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => resetStats(),
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
      >
      {/* Profile Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Feather name="user" size={32} color={c.primary} />
        </View>
        <Text style={styles.profileName}>Bible Champion</Text>
        <Text style={styles.profileSub}>
          {stats.gamesPlayed} quizzes · {stats.totalScore.toLocaleString()} pts
        </Text>
        <View style={styles.rankBadge}>
          <Feather name="award" size={12} color={c.primary} />
          <Text style={styles.rankText}>
            {stats.gamesPlayed === 0
              ? "Newcomer"
              : stats.gamesPlayed < 5
              ? "Novice"
              : stats.gamesPlayed < 20
              ? "Seeker"
              : stats.gamesPlayed < 50
              ? "Believer"
              : "Champion"}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Overall Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard label="Total Score" value={stats.totalScore.toLocaleString()} icon="star" color={c.primary} small />
          <StatCard label="High Score" value={stats.highScore} icon="trending-up" color="#8E44AD" small />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Games Played" value={stats.gamesPlayed} icon="play" color="#2980B9" small />
          <StatCard label="Accuracy" value={`${accuracy}%`} icon="target" color={c.correct} small />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Current Streak" value={stats.currentStreak} icon="zap" color="#E74C3C" small />
          <StatCard label="Best Streak" value={stats.bestStreak} icon="award" color="#F39C12" small />
        </View>
      </View>

      {/* Category Breakdown */}
      <Text style={styles.sectionTitle}>Category Breakdown</Text>
      <View style={styles.categoryList}>
        {CATEGORIES.map((cat) => {
          const score = stats.categoryScores[cat];
          const acc = score && score.total > 0
            ? Math.round((score.correct / score.total) * 100)
            : null;
          return (
            <View key={cat} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{cat}</Text>
              <View style={styles.categoryRight}>
                {acc !== null ? (
                  <>
                    <Text style={styles.categoryAcc}>{acc}%</Text>
                    <View style={styles.accuracyBar}>
                      <View
                        style={[styles.accuracyFill, { width: `${acc}%` as any }]}
                      />
                    </View>
                  </>
                ) : (
                  <Text style={styles.notPlayed}>Not played</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Achievements */}
      <Text style={styles.sectionTitle}>Achievements</Text>
      {stats.achievements.length === 0 ? (
        <View style={styles.emptyAch}>
          <Feather name="award" size={32} color={c.mutedForeground} />
          <Text style={styles.emptyAchText}>
            Play quizzes to unlock achievements!
          </Text>
        </View>
      ) : (
        <View style={styles.achievementsGrid}>
          {stats.achievements.map((ach) => (
            <View key={ach.id} style={styles.achCard}>
              <View style={styles.achIcon}>
                <Feather name={ach.icon as any} size={20} color={c.primary} />
              </View>
              <Text style={styles.achTitle}>{ach.title}</Text>
              <Text style={styles.achDesc}>{ach.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Reset */}
      <Pressable
        style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.7 }]}
        onPress={handleReset}
      >
        <Feather name="trash-2" size={14} color={c.wrong} />
        <Text style={styles.resetText}>Reset Progress</Text>
      </Pressable>

      <View style={{ height: Platform.OS === "web" ? 100 : 80 }} />
    </ScrollView>
    </View>
  );
}

const c = colors.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  profileCard: {
    backgroundColor: c.card,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: c.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.primary + "22",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: c.primary + "44",
  },
  profileName: {
    color: c.foreground,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  profileSub: {
    color: c.mutedForeground,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: c.primary + "22",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  rankText: {
    color: c.primary,
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },

  sectionTitle: {
    color: c.foreground,
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },

  statsGrid: { gap: 10, marginBottom: 28 },
  statsRow: { flexDirection: "row", gap: 10 },

  categoryList: {
    backgroundColor: c.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    overflow: "hidden",
    marginBottom: 28,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  categoryName: {
    color: c.foreground,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  categoryRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  categoryAcc: {
    color: c.correct,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  accuracyBar: {
    width: 80,
    height: 4,
    backgroundColor: c.muted,
    borderRadius: 2,
    overflow: "hidden",
  },
  accuracyFill: {
    height: "100%",
    backgroundColor: c.correct,
    borderRadius: 2,
  },
  notPlayed: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  achCard: {
    width: "48%",
    backgroundColor: c.card,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: c.primary + "33",
  },
  achIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: c.primary + "22",
    alignItems: "center",
    justifyContent: "center",
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

  emptyAch: {
    alignItems: "center",
    padding: 32,
    gap: 12,
    backgroundColor: c.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 28,
  },
  emptyAchText: {
    color: c.mutedForeground,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
  },
  resetText: {
    color: c.wrong,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
