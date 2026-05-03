import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CategoryCard from "@/components/CategoryCard";
import ScreenBackground from "@/components/ScreenBackground";
import colors from "@/constants/colors";
import { CATEGORIES, Category, Difficulty } from "@/constants/questions";

const DIFFICULTIES: { key: Difficulty; label: string; desc: string; color: string; icon: string }[] = [
  { key: "easy", label: "Easy", desc: "Great for beginners", color: "#27AE60", icon: "smile" },
  { key: "medium", label: "Medium", desc: "Intermediate knowledge", color: "#F5A623", icon: "meh" },
  { key: "hard", label: "Hard", desc: "For Bible scholars", color: "#E74C3C", icon: "frown" },
];

export default function PlayScreen() {
  const c = colors.light;
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleCategoryPress = (cat: Category) => {
    setSelectedCategory(cat);
    setModalVisible(true);
  };

  const handleStartQuiz = (difficulty: Difficulty) => {
    setModalVisible(false);
    router.push({
      pathname: "/quiz",
      params: { category: selectedCategory!, difficulty },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Choose a Category</Text>
        <Text style={styles.subheading}>
          Select a topic and test your knowledge
        </Text>

        {/* Quick Play */}
        <Pressable
          style={({ pressed }) => [styles.quickPlay, pressed && { opacity: 0.85 }]}
          onPress={() => router.push({ pathname: "/quiz", params: { mode: "random" } })}
        >
          <View style={styles.quickPlayIcon}>
            <Feather name="shuffle" size={20} color={c.primary} />
          </View>
          <View style={styles.quickPlayText}>
            <Text style={styles.quickPlayTitle}>Random Mix</Text>
            <Text style={styles.quickPlayDesc}>10 questions from all categories</Text>
          </View>
          <Feather name="arrow-right" size={18} color={c.mutedForeground} />
        </Pressable>

        <Text style={styles.sectionLabel}>BY CATEGORY</Text>

        {CATEGORIES.map((cat) => (
          <CategoryCard key={cat} category={cat} onPress={handleCategoryPress} />
        ))}

        <View style={{ height: Platform.OS === "web" ? 100 : 80 }} />
      </ScrollView>

      {/* Difficulty Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{selectedCategory}</Text>
            <Text style={styles.modalSubtitle}>Choose your difficulty</Text>
            <View style={styles.difficultyList}>
              {DIFFICULTIES.map((d) => (
                <Pressable
                  key={d.key}
                  style={({ pressed }) => [
                    styles.difficultyCard,
                    { borderColor: d.color + "44" },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => handleStartQuiz(d.key)}
                >
                  <View style={[styles.diffIcon, { backgroundColor: d.color + "22" }]}>
                    <Feather name={d.icon as any} size={20} color={d.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.diffLabel, { color: d.color }]}>{d.label}</Text>
                    <Text style={styles.diffDesc}>{d.desc}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={c.mutedForeground} />
                </Pressable>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const c = colors.light;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },

  heading: {
    color: c.foreground,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  subheading: {
    color: c.mutedForeground,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },

  quickPlay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: c.primary + "44",
    gap: 14,
  },
  quickPlayIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: c.primary + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  quickPlayText: { flex: 1 },
  quickPlayTitle: {
    color: c.foreground,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  quickPlayDesc: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  sectionLabel: {
    color: c.mutedForeground,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: c.cardElevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.muted,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: c.foreground,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  modalSubtitle: {
    color: c.mutedForeground,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  difficultyList: { gap: 10 },
  difficultyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    gap: 14,
  },
  diffIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  diffLabel: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  diffDesc: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
