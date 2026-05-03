import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import colors from "@/constants/colors";
import { Category, CATEGORY_ICONS } from "@/constants/questions";
import { useGame } from "@/context/GameContext";

interface Props {
  category: Category;
  onPress: (category: Category) => void;
}

const CATEGORY_COLORS: Record<Category, string> = {
  "Old Testament": "#F5A623",
  "New Testament": "#7B5EA7",
  "Psalms & Proverbs": "#27AE60",
  "Parables": "#2980B9",
  "Prophecy": "#8E44AD",
  "Miracles & Signs": "#E74C3C",
  "Apostles & Disciples": "#16A085",
};

export default function CategoryCard({ category, onPress }: Props) {
  const c = colors.light;
  const { stats } = useGame();
  const catScore = stats.categoryScores[category];
  const accuracy = catScore && catScore.total > 0
    ? Math.round((catScore.correct / catScore.total) * 100)
    : null;
  const accentColor = CATEGORY_COLORS[category];
  const iconName = CATEGORY_ICONS[category] as any;

  return (
    <Pressable
      onPress={() => onPress(category)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.iconBox, { backgroundColor: accentColor + "22" }]}>
        <Feather name={iconName} size={22} color={accentColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{category}</Text>
        {accuracy !== null ? (
          <Text style={styles.accuracy}>{accuracy}% accuracy</Text>
        ) : (
          <Text style={styles.untried}>Not played yet</Text>
        )}
      </View>
      <View style={[styles.badge, { backgroundColor: accentColor + "22" }]}>
        <Feather name="chevron-right" size={16} color={accentColor} />
      </View>
    </Pressable>
  );
}

const c = colors.light;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: c.border,
    gap: 14,
  },
  cardPressed: {
    opacity: 0.75,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    color: c.foreground,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  accuracy: {
    color: c.correct,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  untried: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
