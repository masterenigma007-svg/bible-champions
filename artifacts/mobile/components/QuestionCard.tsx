import React from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import colors from "@/constants/colors";

interface Props {
  question: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number;
  revealed: boolean;
  onSelect: (index: number) => void;
  questionNumber: number;
  total: number;
  verse?: string;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function QuestionCard({
  question,
  options,
  selectedIndex,
  correctIndex,
  revealed,
  onSelect,
  questionNumber,
  total,
  verse,
}: Props) {
  const c = colors.light;

  const getOptionStyle = (index: number) => {
    if (!revealed) {
      return selectedIndex === index ? styles.optionSelected : styles.optionDefault;
    }
    if (index === correctIndex) return styles.optionCorrect;
    if (index === selectedIndex && selectedIndex !== correctIndex) return styles.optionWrong;
    return styles.optionDefault;
  };

  const getOptionLabelStyle = (index: number) => {
    if (!revealed) {
      return selectedIndex === index ? styles.labelSelected : styles.labelDefault;
    }
    if (index === correctIndex) return styles.labelCorrect;
    if (index === selectedIndex && selectedIndex !== correctIndex) return styles.labelWrong;
    return styles.labelDefault;
  };

  const getOptionTextStyle = (index: number) => {
    if (!revealed) {
      return selectedIndex === index ? styles.optionTextSelected : styles.optionText;
    }
    if (index === correctIndex) return styles.optionTextCorrect;
    if (index === selectedIndex && selectedIndex !== correctIndex) return styles.optionTextWrong;
    return styles.optionText;
  };

  return (
    <View style={styles.container}>
      <View style={styles.questionBox}>
        <Text style={styles.questionNumber}>
          Question {questionNumber} of {total}
        </Text>
        <Text style={styles.questionText}>{question}</Text>
        {verse && revealed && (
          <Text style={styles.verse}>{verse}</Text>
        )}
      </View>

      <View style={styles.options}>
        {options.map((option, index) => (
          <Pressable
            key={index}
            onPress={() => !revealed && onSelect(index)}
            disabled={revealed}
            style={({ pressed }) => [
              styles.option,
              getOptionStyle(index),
              pressed && !revealed && styles.optionPressed,
            ]}
          >
            <View style={[styles.optionLabel, getOptionLabelStyle(index)]}>
              <Text style={styles.optionLabelText}>{OPTION_LABELS[index]}</Text>
            </View>
            <Text style={[styles.optionText, getOptionTextStyle(index)]} numberOfLines={2}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const c = colors.light;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  questionBox: {
    backgroundColor: c.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: c.border,
  },
  questionNumber: {
    color: c.primary,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  questionText: {
    color: c.foreground,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 26,
  },
  verse: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 10,
    fontStyle: "italic",
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  optionDefault: {
    backgroundColor: c.card,
    borderColor: c.border,
  },
  optionSelected: {
    backgroundColor: c.muted,
    borderColor: c.primary,
  },
  optionCorrect: {
    backgroundColor: c.correctBg,
    borderColor: c.correct,
  },
  optionWrong: {
    backgroundColor: c.wrongBg,
    borderColor: c.wrong,
  },
  optionPressed: {
    opacity: 0.8,
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  labelDefault: {
    backgroundColor: c.muted,
  },
  labelSelected: {
    backgroundColor: c.primary,
  },
  labelCorrect: {
    backgroundColor: c.correct,
  },
  labelWrong: {
    backgroundColor: c.wrong,
  },
  optionLabelText: {
    color: c.foreground,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  optionText: {
    flex: 1,
    color: c.mutedForeground,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  optionTextSelected: {
    flex: 1,
    color: c.foreground,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  optionTextCorrect: {
    flex: 1,
    color: c.correct,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  optionTextWrong: {
    flex: 1,
    color: c.wrong,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
