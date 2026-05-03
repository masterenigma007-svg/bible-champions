import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SMS from "expo-sms";
import React, { useEffect } from "react";
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
import { useBattle } from "@/context/BattleContext";
import ScreenBackground from "@/components/ScreenBackground";
import { useGame } from "@/context/GameContext";

export default function BattleResultsScreen() {
  const insets = useSafeAreaInsets();
  const c = colors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top + 20;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 20;
  const { state, reset } = useBattle();
  const { profile } = useGame();

  const myScore = state.myScore;
  const opponentScore = state.opponentScore;
  const winner = state.winner;
  const myName = state.players.find((p) => p.isMe)?.name ?? "You";
  const opponentName = state.players.find((p) => !p.isMe)?.name ?? "Opponent";

  const getOutcome = () => {
    if (winner === "me")
      return { label: "You Win! 🏆", sublabel: "You're a Bible Champion!", color: "#FFD700", icon: "award" };
    if (winner === "tie")
      return { label: "It's a Tie!", sublabel: "Well matched — play again?", color: c.primary, icon: "minus-circle" };
    return { label: "You Lose!", sublabel: "Keep studying and try again!", color: c.wrong, icon: "refresh-cw" };
  };

  const outcome = getOutcome();

  const handlePlayAgain = () => {
    reset();
    router.replace("/(tabs)/battle");
  };

  const handleHome = () => {
    reset();
    router.replace("/(tabs)" as any);
  };

  const handleShare = async () => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) return;
    const name = profile.name.trim() || myName;
    const resultLine =
      winner === "me"
        ? `${name} won a Bible Champions battle! 🏆`
        : winner === "tie"
        ? `${name} tied in a Bible Champions battle!`
        : `${name} played a Bible Champions battle!`;
    const msg =
      `${resultLine} ✝️ Score: ${myScore.toLocaleString()} vs ${opponentName}'s ${opponentScore.toLocaleString()}. ` +
      `${state.myCorrect}/${state.questions.length} correct. Think you can beat that? Play Bible Champions!`;
    await SMS.sendSMSAsync([], msg);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Result Header */}
        <View style={styles.outcomeArea}>
          <View
            style={[
              styles.outcomeCircle,
              { borderColor: outcome.color + "44", backgroundColor: outcome.color + "11" },
            ]}
          >
            <Feather name={outcome.icon as any} size={52} color={outcome.color} />
          </View>
          <Text style={[styles.outcomeLabel, { color: outcome.color }]}>
            {outcome.label}
          </Text>
          <Text style={styles.outcomeSub}>{outcome.sublabel}</Text>
        </View>

        {/* Score Comparison */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreColumn}>
            <Text style={styles.playerLabel}>{myName}</Text>
            <Text style={[styles.bigScore, { color: c.primary }]}>
              {myScore.toLocaleString()}
            </Text>
            <Text style={styles.correctLabel}>{state.myCorrect} correct</Text>
          </View>

          <View style={styles.scoreDivider}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={[styles.scoreColumn, { alignItems: "flex-end" }]}>
            <Text style={styles.playerLabel}>{opponentName}</Text>
            <Text style={[styles.bigScore, { color: c.secondary }]}>
              {opponentScore.toLocaleString()}
            </Text>
            <Text style={styles.correctLabel}>{state.opponentCorrect} correct</Text>
          </View>
        </View>

        {/* Stats breakdown */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Questions</Text>
            <Text style={styles.statValue}>{state.questions.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>My accuracy</Text>
            <Text style={styles.statValue}>
              {state.questions.length > 0
                ? `${Math.round((state.myCorrect / state.questions.length) * 100)}%`
                : "—"}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Margin</Text>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    myScore > opponentScore
                      ? c.correct
                      : myScore < opponentScore
                      ? c.wrong
                      : c.foreground,
                },
              ]}
            >
              {myScore === opponentScore
                ? "Tied"
                : myScore > opponentScore
                ? `+${myScore - opponentScore}`
                : `-${opponentScore - myScore}`}
            </Text>
          </View>
        </View>

        {/* Verse */}
        <View style={styles.verseCard}>
          <Text style={styles.verseText}>
            "Do you not know that in a race all the runners run, but only one gets the prize?
            Run in such a way as to get the prize." — 1 Corinthians 9:24
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            onPress={handlePlayAgain}
          >
            <Feather name="refresh-cw" size={16} color={c.primaryForeground} />
            <Text style={styles.primaryBtnText}>Play Again</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.85 }]}
            onPress={handleShare}
          >
            <Feather name="message-circle" size={16} color={c.primaryForeground} />
            <Text style={styles.shareBtnText}>Share via Text</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
            onPress={handleHome}
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
  content: { paddingHorizontal: 24 },

  outcomeArea: { alignItems: "center", marginBottom: 28 },
  outcomeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  outcomeLabel: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  outcomeSub: {
    color: c.mutedForeground,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  scoreCard: {
    flexDirection: "row",
    backgroundColor: c.card,
    borderRadius: 22,
    padding: 24,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
  },
  scoreColumn: { flex: 1, alignItems: "flex-start" },
  playerLabel: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
  },
  bigScore: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  correctLabel: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  scoreDivider: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  vsText: {
    color: c.mutedForeground,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },

  statsCard: {
    backgroundColor: c.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: c.border,
    gap: 14,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    color: c.mutedForeground,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  statValue: {
    color: c.foreground,
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },

  verseCard: {
    backgroundColor: c.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: c.border,
  },
  verseText: {
    color: c.mutedForeground,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 20,
    textAlign: "center",
  },

  actions: { gap: 12 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#2980B9",
    borderRadius: 16,
    paddingVertical: 16,
  },
  shareBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
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
