import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const { stats, profile, resetStats, setProfile } = useGame();

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [emailInput, setEmailInput] = useState(profile.email);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library to set a profile photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      await setProfile(profile.name, profile.email, result.assets[0].uri);
    }
  };

  const accuracy =
    stats.totalAnswers > 0
      ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100)
      : 0;

  const displayName = profile.name.trim() || "Bible Champion";

  const handleEditOpen = () => {
    setNameInput(profile.name);
    setEmailInput(profile.email);
    setEditing(true);
  };

  const handleSave = async () => {
    await setProfile(nameInput, emailInput);
    setEditing(false);
  };

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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Header */}
        <View style={styles.profileCard}>
          <Pressable onPress={handlePickPhoto} style={styles.avatarWrapper}>
            {profile.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={styles.avatarPhoto} />
            ) : (
              <View style={styles.avatar}>
                <Feather name="user" size={32} color={c.primary} />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Feather name="camera" size={12} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.profileName}>{displayName}</Text>
          {profile.email ? (
            <Text style={styles.profileEmail}>{profile.email}</Text>
          ) : null}
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

          <Pressable
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.75 }]}
            onPress={handleEditOpen}
          >
            <Feather name="edit-2" size={13} color={c.primaryForeground} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Edit Form */}
        {editing && (
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Edit Profile</Text>

            <Text style={styles.fieldLabel}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              placeholderTextColor={c.mutedForeground}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Text style={styles.fieldLabel}>Email (optional)</Text>
            <TextInput
              style={styles.input}
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="Enter your email"
              placeholderTextColor={c.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            <View style={styles.editActions}>
              <Pressable
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.75 }]}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
                onPress={handleSave}
              >
                <Feather name="check" size={14} color={c.primaryForeground} />
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        )}

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
    </KeyboardAvoidingView>
  );
}

const c = colors.light;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  profileCard: {
    backgroundColor: c.card,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: c.border,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.primary + "22",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: c.primary + "44",
  },
  avatarPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: c.primary + "66",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: c.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileName: {
    color: c.foreground,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  profileEmail: {
    color: c.mutedForeground,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
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
    marginBottom: 16,
  },
  rankText: {
    color: c.primary,
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: c.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  editBtnText: {
    color: c.primaryForeground,
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },

  editCard: {
    backgroundColor: c.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: c.border,
  },
  editTitle: {
    color: c.foreground,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  fieldLabel: {
    color: c.foreground,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  input: {
    backgroundColor: c.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: c.foreground,
    marginBottom: 14,
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.background,
  },
  cancelBtnText: {
    color: c.foreground,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: c.primary,
  },
  saveBtnText: {
    color: c.primaryForeground,
    fontFamily: "Inter_700Bold",
    fontSize: 14,
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
    paddingHorizontal: 16,
    paddingVertical: 13,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categoryAcc: {
    color: c.primary,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    width: 36,
    textAlign: "right",
  },
  accuracyBar: {
    width: 60,
    height: 6,
    backgroundColor: c.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  accuracyFill: {
    height: "100%",
    backgroundColor: c.primary,
    borderRadius: 3,
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
    width: "47%",
    backgroundColor: c.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: c.border,
  },
  achIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  achTitle: {
    color: c.foreground,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  achDesc: {
    color: c.mutedForeground,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  emptyAch: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
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
