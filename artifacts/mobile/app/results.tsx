import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";

export default function ResultsScreen() {
  const params = useLocalSearchParams<{
    score: string;
    correct: string;
    total: string;
    category: string;
    difficulty: string;
  }>();
  const insets = useSafeAreaInsets();
  const c = colors.light;

  const score = parseInt(params.score ?? "0", 10);
  const correct = parseInt(params.correct ?? "0", 10);
  const total = parseInt(params.total ?? "10", 10);
  const accuracy = Math.round((correct / total) * 100);
  const topPad = Platform.OS === "web" ? 67 : insets.top + 20;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 20;

  const getGrade = () => {
    if (accuracy === 100) return { label: "Perfect!", color: "#FFD700", icon: "award" };
    if (accuracy >= 80) return { label: "Excellent!", color: c.correct, icon: "star" };
    if (accuracy >= 60) return { label: "Good Job!", color: c.primary, icon: "thumbs-up" };
    if (accuracy >= 40) return { label: "Keep Going!", color: "#2980B9", icon: "refresh-cw" };
    return { label: "Keep Studying!", color: c.wrong, icon: "book-open" };
  };

  const grade = getGrade();

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad, paddingBottom: botPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Trophy Area */}
        <View style={styles.trophyArea}>
          <View style={[styles.trophyCircle, { borderColor: grade.color + "44", backgroundColor: grade.color + "11" }]}>
            <Feather name={grade.icon as any} size={56} color={grade.color} />
          </View>
          <Text style={[styles.gradeLabel, { color: grade.color }]}>{grade.label}</Text>
          <Text style={styles.scoreDisplay}>{score.toLocaleString()}</Text>
          <Text style={styles.scoreSubtitle}>points earned</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{correct}/{total}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={[styles.statDivider]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: grade.color }]}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={[styles.statDivider]} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{params.difficulty}</Text>
            <Text style={styles.statLabel}>Difficulty</Text>
          </View>
        </View>

        {/* Category */}
        <View style={styles.categoryBox}>
          <Feather name="book" size={16} color={c.mutedForeground} />
          <Text style={styles.categoryText}>{params.category}</Text>
        </View>

        {/* Motivational Message */}
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            {accuracy === 100
              ? "Incredible! You got every question right. You truly are a Bible Champion!"
              : accuracy >= 80
              ? "Outstanding performance! Your knowledge of the Scripture is impressive."
              : accuracy >= 60
              ? "Well done! Keep reading and practicing to sharpen your knowledge."
              : accuracy >= 40
              ? "Not bad! Every quiz is a step closer to becoming a Bible Champion."
              : "Every journey begins with a single step. Keep studying God's Word!"}
          </Text>
          <Text style={styles.verseText}>
            "Your word is a lamp to my feet and a light to my path." — Psalm 119:105
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.replace("/(tabs)/play")}
          >
            <Feather name="play" size={16} color={c.primaryForeground} />
            <Text style={styles.primaryBtnText}>Play Again</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.replace("/(tabs)/")}
          >
            <Feather name="home" size={16} color={c.foreground} />
            <Text style={styles.secondaryBtnText}>Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const c = colors.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 24, alignItems: "stretch" },

  trophyArea: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 12,
  },
  trophyCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  gradeLabel: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  scoreDisplay: {
    color: c.foreground,
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    lineHeight: 56,
  },
  scoreSubtitle: {
    color: c.mutedForeground,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: c.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
  },
  statBox: { flex: 1, alignItems: "center" },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: c.border,
  },
  statValue: {
    color: c.foreground,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  statLabel: {
    color: c.mutedForeground,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  categoryBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: c.border,
  },
  categoryText: {
    color: c.foreground,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },

  messageBox: {
    backgroundColor: c.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12,
  },
  messageText: {
    color: c.foreground,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 22,
  },
  verseText: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 18,
  },

  actions: { gap: 12 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: c.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },
  primaryBtnText: {
    color: c.primaryForeground,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: c.card,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: c.border,
  },
  secondaryBtnText: {
    color: c.foreground,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
