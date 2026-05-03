import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import TimerBar from "@/components/TimerBar";
import colors from "@/constants/colors";
import { useBattle } from "@/context/BattleContext";

const OPTION_LABELS = ["A", "B", "C", "D"];
const QUESTION_TIME = 15;

export default function BattleQuizScreen() {
  const insets = useSafeAreaInsets();
  const c = colors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top + 12;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 16;
  const { state, submitAnswer, leaveRoom } = useBattleSocket();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const timeLeftRef = useRef(QUESTION_TIME);
  const hasAnsweredRef = useRef(false);

  const currentQ = state.questions[state.currentQuestion];
  const revealed = state.answerResult !== null;

  // React to question changes
  useEffect(() => {
    setSelectedIndex(null);
    setTimerKey((k) => k + 1);
    setTimerRunning(true);
    timeLeftRef.current = QUESTION_TIME;
    hasAnsweredRef.current = false;
  }, [state.currentQuestion]);

  // Navigate when game is over or opponent left
  useEffect(() => {
    if (state.status === "finished") {
      router.replace("/battle-results");
    }
    if (state.status === "opponent_left") {
      Alert.alert("Opponent left", "Your opponent disconnected. You win!", [
        { text: "OK", onPress: () => router.replace("/(tabs)/battle") }
      ]);
    }
  }, [state.status]);

  const handleAnswer = (index: number) => {
    if (hasAnsweredRef.current || revealed) return;
    hasAnsweredRef.current = true;
    setTimerRunning(false);
    setSelectedIndex(index);
    submitAnswer(state.currentQuestion, index, timeLeftRef.current);
    if (index === currentQ?.correctIndex) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleTimerExpire = () => {
    if (!hasAnsweredRef.current) {
      hasAnsweredRef.current = true;
      submitAnswer(state.currentQuestion, -1, 0);
    }
  };

  const getOptionStyle = (index: number) => {
    if (!revealed) {
      return selectedIndex === index ? styles.optionSelected : styles.optionDefault;
    }
    if (index === state.answerResult?.correctIndex) return styles.optionCorrect;
    if (index === selectedIndex && selectedIndex !== state.answerResult?.correctIndex)
      return styles.optionWrong;
    return styles.optionDefault;
  };

  const getLabelStyle = (index: number) => {
    if (!revealed) return selectedIndex === index ? styles.labelSelected : styles.labelDefault;
    if (index === state.answerResult?.correctIndex) return styles.labelCorrect;
    if (index === selectedIndex && selectedIndex !== state.answerResult?.correctIndex)
      return styles.labelWrong;
    return styles.labelDefault;
  };

  const getTextStyle = (index: number) => {
    if (!revealed) return selectedIndex === index ? styles.optionTextActive : styles.optionText;
    if (index === state.answerResult?.correctIndex) return styles.optionTextCorrect;
    if (index === selectedIndex && selectedIndex !== state.answerResult?.correctIndex)
      return styles.optionTextWrong;
    return styles.optionText;
  };

  const opponentName = state.players.find((p) => !p.isMe)?.name ?? "Opponent";
  const myName = state.players.find((p) => p.isMe)?.name ?? "You";

  if (!currentQ) {
    return (
      <View style={[styles.loading, { backgroundColor: c.background }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Header: Live Scores */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreName}>{myName}</Text>
          <Text style={[styles.scoreValue, { color: c.primary }]}>{state.myScore}</Text>
        </View>

        <View style={styles.centerBlock}>
          <Text style={styles.questionCounter}>
            {state.currentQuestion + 1}/{state.questions.length}
          </Text>
          <Pressable
            onPress={() =>
              Alert.alert("Leave Battle?", "You'll forfeit the match.", [
                { text: "Stay", style: "cancel" },
                { text: "Leave", style: "destructive", onPress: () => { leaveRoom(); router.replace("/(tabs)/battle"); } },
              ])
            }
          >
            <Feather name="x" size={20} color={c.mutedForeground} />
          </Pressable>
        </View>

        <View style={[styles.scoreBlock, { alignItems: "flex-end" }]}>
          <Text style={styles.scoreName}>{opponentName}</Text>
          <Text style={[styles.scoreValue, { color: c.secondary }]}>{state.opponentScore}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((state.currentQuestion + 1) / state.questions.length) * 100}%` as any,
              },
            ]}
          />
        </View>
      </View>

      {/* Timer */}
      <View style={styles.timerWrap}>
        <TimerBar
          key={timerKey}
          duration={QUESTION_TIME}
          onExpire={handleTimerExpire}
          running={timerRunning}
        />
      </View>

      {/* Opponent status */}
      <View style={styles.opponentStatus}>
        <View
          style={[
            styles.opponentDot,
            { backgroundColor: state.opponentAnsweredCurrent ? c.correct : c.mutedForeground },
          ]}
        />
        <Text style={styles.opponentStatusText}>
          {state.opponentAnsweredCurrent
            ? `${opponentName} has answered`
            : `${opponentName} is thinking...`}
        </Text>
      </View>

      {/* Answer result banner */}
      {revealed && state.answerResult && (
        <View
          style={[
            styles.resultBanner,
            {
              backgroundColor: state.answerResult.correct ? c.correctBg : c.wrongBg,
              borderColor: state.answerResult.correct ? c.correct : c.wrong,
            },
          ]}
        >
          <Feather
            name={state.answerResult.correct ? "check-circle" : "x-circle"}
            size={18}
            color={state.answerResult.correct ? c.correct : c.wrong}
          />
          <Text
            style={[
              styles.resultBannerText,
              { color: state.answerResult.correct ? c.correct : c.wrong },
            ]}
          >
            {state.answerResult.correct
              ? `+${state.answerResult.pointsEarned} pts`
              : "Incorrect — waiting for next question"}
          </Text>
        </View>
      )}

      {/* Question */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionBox}>
          <Text style={styles.categoryBadge}>
            {currentQ.category} · {currentQ.difficulty}
          </Text>
          <Text style={styles.questionText}>{currentQ.question}</Text>
        </View>

        <View style={styles.options}>
          {currentQ.options.map((opt, i) => (
            <Pressable
              key={i}
              onPress={() => handleAnswer(i)}
              disabled={revealed || hasAnsweredRef.current}
              style={({ pressed }) => [
                styles.option,
                getOptionStyle(i),
                pressed && !revealed && !hasAnsweredRef.current && { opacity: 0.8 },
              ]}
            >
              <View style={[styles.optionLabel, getLabelStyle(i)]}>
                <Text style={styles.optionLabelText}>{OPTION_LABELS[i]}</Text>
              </View>
              <Text style={[styles.optionText, getTextStyle(i)]} numberOfLines={2}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const c = colors.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: c.mutedForeground, fontSize: 16, fontFamily: "Inter_400Regular" },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  scoreBlock: { flex: 1, alignItems: "flex-start" },
  centerBlock: { alignItems: "center", gap: 4, paddingTop: 2 },
  scoreName: {
    color: c.mutedForeground,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  questionCounter: {
    color: c.mutedForeground,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  progressRow: { paddingHorizontal: 16, marginBottom: 6 },
  progressTrack: { height: 4, backgroundColor: c.muted, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: c.primary, borderRadius: 2 },

  timerWrap: { paddingHorizontal: 16, marginBottom: 10 },

  opponentStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  opponentDot: { width: 8, height: 8, borderRadius: 4 },
  opponentStatusText: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  resultBannerText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },

  questionBox: {
    backgroundColor: c.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: c.border,
  },
  categoryBadge: {
    color: c.primary,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  questionText: {
    color: c.foreground,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 25,
  },

  options: { gap: 10 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  optionDefault: { backgroundColor: c.card, borderColor: c.border },
  optionSelected: { backgroundColor: c.muted, borderColor: c.primary },
  optionCorrect: { backgroundColor: c.correctBg, borderColor: c.correct },
  optionWrong: { backgroundColor: c.wrongBg, borderColor: c.wrong },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  labelDefault: { backgroundColor: c.muted },
  labelSelected: { backgroundColor: c.primary },
  labelCorrect: { backgroundColor: c.correct },
  labelWrong: { backgroundColor: c.wrong },
  optionLabelText: { color: c.foreground, fontSize: 13, fontFamily: "Inter_700Bold" },
  optionText: {
    flex: 1,
    color: c.mutedForeground,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  optionTextActive: { flex: 1, color: c.foreground, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  optionTextCorrect: { flex: 1, color: c.correct, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  optionTextWrong: { flex: 1, color: c.wrong, fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
