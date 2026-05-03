import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QuestionCard from "@/components/QuestionCard";
import TimerBar from "@/components/TimerBar";
import colors from "@/constants/colors";
import {
  Category,
  Difficulty,
  Question,
  getQuestionsByCategory,
  getRandomQuestions,
} from "@/constants/questions";
import { useGame } from "@/context/GameContext";

const QUESTION_TIME = 15;
const POINTS_EASY = 100;
const POINTS_MEDIUM = 200;
const POINTS_HARD = 300;
const TIME_BONUS_MAX = 50;

export default function QuizScreen() {
  const params = useLocalSearchParams<{
    category?: Category;
    difficulty?: Difficulty;
    mode?: string;
  }>();
  const insets = useSafeAreaInsets();
  const c = colors.light;
  const { updateStatsAfterGame } = useGame();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timeRef = useRef(QUESTION_TIME);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let qs: Question[];
    if (params.mode === "random") {
      qs = getRandomQuestions(10);
    } else {
      qs = getQuestionsByCategory(
        params.category as Category,
        (params.difficulty as Difficulty) ?? "easy",
        10
      );
    }
    setQuestions(qs);
  }, []);

  useEffect(() => {
    timeRef.current = QUESTION_TIME;
    setTimeLeft(QUESTION_TIME);
  }, [currentIndex]);

  const getPointsForDifficulty = (q: Question) => {
    if (q.difficulty === "hard") return POINTS_HARD;
    if (q.difficulty === "medium") return POINTS_MEDIUM;
    return POINTS_EASY;
  };

  const handleAnswer = useCallback(
    (index: number) => {
      if (revealed) return;
      setTimerRunning(false);
      setSelectedIndex(index);
      setRevealed(true);

      const q = questions[currentIndex];
      const isCorrect = index === q.correctIndex;

      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const basePoints = getPointsForDifficulty(q);
        const timeBonus = Math.round((timeRef.current / QUESTION_TIME) * TIME_BONUS_MAX);
        setScore((s) => s + basePoints + timeBonus);
        setCorrectCount((c) => c + 1);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      nextTimerRef.current = setTimeout(() => handleNext(), 1500);
    },
    [revealed, questions, currentIndex]
  );

  const handleTimerExpire = useCallback(() => {
    if (!revealed) {
      handleAnswer(-1);
    }
  }, [revealed, handleAnswer]);

  const handleNext = () => {
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= questions.length) {
      finishGame();
      return;
    }

    setCurrentIndex(nextIndex);
    setSelectedIndex(null);
    setRevealed(false);
    setTimerKey((k) => k + 1);
    setTimerRunning(true);
  };

  const finishGame = async () => {
    const category = (params.category as Category) ?? "Old Testament";
    await updateStatsAfterGame(correctCount, questions.length, score, category);
    router.replace({
      pathname: "/results",
      params: {
        score: score.toString(),
        correct: correctCount.toString(),
        total: questions.length.toString(),
        category: params.category ?? "Random",
        difficulty: params.difficulty ?? "mixed",
      },
    });
  };

  useEffect(() => {
    return () => {
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    };
  }, []);

  if (questions.length === 0) {
    return (
      <View style={[styles.loading, { backgroundColor: c.background }]}>
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  const q = questions[currentIndex];
  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => {
            if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
            router.back();
          }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>✕</Text>
        </Pressable>

        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1}/{questions.length}
        </Text>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <TimerBar
          key={timerKey}
          duration={QUESTION_TIME}
          onExpire={handleTimerExpire}
          running={timerRunning}
        />
      </View>

      {/* Category */}
      <View style={styles.catRow}>
        <View style={styles.catBadge}>
          <Text style={styles.catText}>{q.category}</Text>
        </View>
        <View style={styles.diffBadge}>
          <Text style={styles.diffText}>{q.difficulty}</Text>
        </View>
      </View>

      {/* Question */}
      <ScrollView
        style={styles.questionScroll}
        contentContainerStyle={styles.questionContent}
        showsVerticalScrollIndicator={false}
      >
        <QuestionCard
          question={q.question}
          options={q.options}
          selectedIndex={selectedIndex}
          correctIndex={q.correctIndex}
          revealed={revealed}
          onSelect={handleAnswer}
          questionNumber={currentIndex + 1}
          total={questions.length}
          verse={q.verse}
        />
      </ScrollView>

      {/* Next Button */}
      {revealed && (
        <View style={[styles.nextContainer, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85 }]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>
              {currentIndex + 1 >= questions.length ? "See Results" : "Next Question"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const c = colors.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: c.mutedForeground,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: c.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.border,
  },
  backText: {
    color: c.mutedForeground,
    fontSize: 16,
  },
  scoreBox: {
    alignItems: "flex-end",
  },
  scoreLabel: {
    color: c.mutedForeground,
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  scoreValue: {
    color: c.primary,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },

  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: c.muted,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: c.primary,
    borderRadius: 3,
  },
  progressText: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    minWidth: 36,
    textAlign: "right",
  },

  timerContainer: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },

  catRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  catBadge: {
    backgroundColor: c.secondary + "33",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  catText: {
    color: c.secondary,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  diffBadge: {
    backgroundColor: c.primary + "22",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  diffText: {
    color: c.primary,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },

  questionScroll: { flex: 1 },
  questionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  nextContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  nextBtn: {
    backgroundColor: c.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextBtnText: {
    color: c.primaryForeground,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
