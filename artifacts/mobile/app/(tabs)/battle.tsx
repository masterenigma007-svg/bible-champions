import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import colors from "@/constants/colors";
import { CATEGORIES, Category } from "@/constants/questions";
import { useBattle } from "@/context/BattleContext";

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export default function BattleScreen() {
  const c = colors.light;
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;

  const [tab, setTab] = useState<"create" | "join">("create");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [category, setCategory] = useState<string>("random");
  const [difficulty, setDifficulty] = useState<string>("easy");
  const [loading, setLoading] = useState(false);

  const { state, createRoom, joinRoom, reset } = useBattleSocket();

  // Navigate when state changes
  useEffect(() => {
    if (state.status === "waiting") {
      router.push({
        pathname: "/battle-waiting",
        params: { roomCode: state.roomCode ?? "" },
      });
    }
  }, [state.status]);

  useEffect(() => {
    if (state.error) {
      Alert.alert("Error", state.error, [{ text: "OK", onPress: reset }]);
      setLoading(false);
    }
  }, [state.error]);

  const handleCreate = async () => {
    if (!playerName.trim()) {
      Alert.alert("Enter your name", "Please enter a name before creating a room.");
      return;
    }
    setLoading(true);
    try {
      await createRoom(playerName.trim(), category, difficulty);
    } catch (e: any) {
      Alert.alert("Connection Error", e.message ?? "Could not connect. Is the server running?");
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) {
      Alert.alert("Enter your name", "Please enter a name before joining.");
      return;
    }
    if (roomCode.trim().length < 6) {
      Alert.alert("Enter room code", "Please enter the 6-character room code.");
      return;
    }
    setLoading(true);
    try {
      await joinRoom(playerName.trim(), roomCode.trim());
    } catch (e: any) {
      Alert.alert("Connection Error", e.message ?? "Could not connect. Is the server running?");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.battleIcon}>
            <Feather name="zap" size={24} color={c.primary} />
          </View>
          <View>
            <Text style={styles.heading}>Battle Mode</Text>
            <Text style={styles.subheading}>Head-to-head Bible trivia</Text>
          </View>
        </View>

        {/* Player Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Enter your name"
            placeholderTextColor={c.mutedForeground}
            maxLength={20}
            autoCorrect={false}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === "create" && styles.tabActive]}
            onPress={() => setTab("create")}
          >
            <Text style={[styles.tabText, tab === "create" && styles.tabTextActive]}>
              Create Room
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === "join" && styles.tabActive]}
            onPress={() => setTab("join")}
          >
            <Text style={[styles.tabText, tab === "join" && styles.tabTextActive]}>
              Join Room
            </Text>
          </Pressable>
        </View>

        {tab === "create" ? (
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
            >
              <Pressable
                style={[styles.chip, category === "random" && styles.chipActive]}
                onPress={() => setCategory("random")}
              >
                <Text style={[styles.chipText, category === "random" && styles.chipTextActive]}>
                  Random Mix
                </Text>
              </Pressable>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.label, { marginTop: 16 }]}>Difficulty</Text>
            <View style={styles.diffRow}>
              {DIFFICULTIES.map((d) => (
                <Pressable
                  key={d}
                  style={[styles.diffChip, difficulty === d && styles.diffChipActive]}
                  onPress={() => setDifficulty(d)}
                >
                  <Text
                    style={[
                      styles.diffChipText,
                      difficulty === d && styles.diffChipTextActive,
                    ]}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={c.primaryForeground} />
              ) : (
                <>
                  <Feather name="plus-circle" size={18} color={c.primaryForeground} />
                  <Text style={styles.primaryBtnText}>Create Room</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.label}>Room Code</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={roomCode}
              onChangeText={(t) => setRoomCode(t.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor={c.mutedForeground}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              onPress={handleJoin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={c.primaryForeground} />
              ) : (
                <>
                  <Feather name="log-in" size={18} color={c.primaryForeground} />
                  <Text style={styles.primaryBtnText}>Join Room</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* How it works */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How it works</Text>
          {[
            { icon: "user-plus", text: "Create a room and share the code with a friend" },
            { icon: "log-in", text: "Your opponent joins with the 6-digit code" },
            { icon: "zap", text: "Answer 10 questions simultaneously — faster = more points!" },
            { icon: "award", text: "Highest score wins the battle" },
          ].map((item, i) => (
            <View key={i} style={styles.howRow}>
              <View style={styles.howIcon}>
                <Feather name={item.icon as any} size={14} color={c.primary} />
              </View>
              <Text style={styles.howText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: Platform.OS === "web" ? 100 : 80 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const c = colors.light;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  battleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: c.primary + "22",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: c.primary + "44",
  },
  heading: {
    color: c.foreground,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  subheading: {
    color: c.mutedForeground,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },

  inputGroup: { marginBottom: 20 },
  label: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    backgroundColor: c.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: c.foreground,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  codeInput: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: 6,
    textAlign: "center",
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: c.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: c.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 11,
  },
  tabActive: { backgroundColor: c.primary },
  tabText: {
    color: c.mutedForeground,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  tabTextActive: { color: c.primaryForeground },

  section: { gap: 0 },
  chipScroll: { marginBottom: 4 },
  chip: {
    backgroundColor: c.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { color: c.mutedForeground, fontSize: 13, fontFamily: "Inter_500Medium" },
  chipTextActive: { color: c.primaryForeground, fontFamily: "Inter_700Bold" },

  diffRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  diffChip: {
    flex: 1,
    backgroundColor: c.card,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: c.border,
  },
  diffChipActive: { backgroundColor: c.primary, borderColor: c.primary },
  diffChipText: { color: c.mutedForeground, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  diffChipTextActive: { color: c.primaryForeground },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: c.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 28,
    minHeight: 56,
  },
  primaryBtnText: {
    color: c.primaryForeground,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },

  howCard: {
    backgroundColor: c.card,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: c.border,
  },
  howTitle: {
    color: c.foreground,
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  howRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  howIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: c.primary + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  howText: {
    flex: 1,
    color: c.mutedForeground,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
