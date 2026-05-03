import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useBattle } from "@/context/BattleContext";
import ScreenBackground from "@/components/ScreenBackground";

export default function BattleWaitingScreen() {
  const { roomCode } = useLocalSearchParams<{ roomCode: string }>();
  const insets = useSafeAreaInsets();
  const c = colors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top + 20;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 20;
  const [copied, setCopied] = useState(false);
  const { state, leaveRoom } = useBattle();

  useEffect(() => {
    if (state.status === "playing") {
      router.replace({
        pathname: "/battle-quiz",
      });
    }
    if (state.status === "opponent_left" || state.status === "error") {
      const msg = state.status === "opponent_left"
        ? "Your opponent left the room."
        : state.error ?? "Something went wrong.";
      Alert.alert("Room closed", msg, [
        { text: "OK", onPress: () => router.replace("/(tabs)/battle") }
      ]);
    }
  }, [state.status]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(roomCode ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    Alert.alert("Leave Room", "Are you sure you want to leave?", [
      { text: "Stay", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => {
          leaveRoom();
          router.replace("/(tabs)/battle");
        },
      },
    ]);
  };

  const displayCode = roomCode ?? state.roomCode ?? "------";
  const myPlayer = state.players.find((p) => p.isMe);
  const opponent = state.players.find((p) => !p.isMe);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScreenBackground />
      <View style={[styles.content, { paddingTop: topPad, paddingBottom: botPad }]}>
        {/* Back */}
        <Pressable onPress={handleLeave} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={c.mutedForeground} />
        </Pressable>

        <Text style={styles.title}>Waiting for Opponent</Text>
        <Text style={styles.subtitle}>Share this code with your friend</Text>

        {/* Room Code */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>ROOM CODE</Text>
          <Text style={styles.codeText}>{displayCode}</Text>
          <Pressable
            style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.8 }]}
            onPress={handleCopy}
          >
            <Feather name={copied ? "check" : "copy"} size={16} color={copied ? c.correct : c.primary} />
            <Text style={[styles.copyBtnText, copied && { color: c.correct }]}>
              {copied ? "Copied!" : "Copy Code"}
            </Text>
          </Pressable>
        </View>

        {/* Players */}
        <View style={styles.playersCard}>
          <Text style={styles.playersTitle}>Players</Text>
          <View style={styles.playerRow}>
            <View style={[styles.playerAvatar, { borderColor: c.primary + "66" }]}>
              <Feather name="user" size={20} color={c.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName}>{myPlayer?.name ?? "You"}</Text>
              <Text style={styles.playerStatus}>Ready</Text>
            </View>
            <Feather name="check-circle" size={20} color={c.correct} />
          </View>

          <View style={styles.vsBar}>
            <View style={styles.vsDivider} />
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.vsDivider} />
          </View>

          <View style={styles.playerRow}>
            <View style={[styles.playerAvatar, { borderColor: opponent ? c.secondary + "66" : c.border }]}>
              {opponent ? (
                <Feather name="user" size={20} color={c.secondary} />
              ) : (
                <ActivityIndicator size="small" color={c.mutedForeground} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName}>
                {opponent?.name ?? "Waiting..."}
              </Text>
              <Text style={styles.playerStatus}>
                {opponent ? "Ready" : "Not joined yet"}
              </Text>
            </View>
            {opponent ? (
              <Feather name="check-circle" size={20} color={c.correct} />
            ) : (
              <ActivityIndicator size="small" color={c.mutedForeground} />
            )}
          </View>
        </View>

        {!opponent && (
          <View style={styles.waitingHint}>
            <ActivityIndicator color={c.primary} style={{ marginRight: 8 }} />
            <Text style={styles.waitingHintText}>
              Game starts automatically when your opponent joins
            </Text>
          </View>
        )}

        {opponent && (
          <View style={styles.startingSoon}>
            <Feather name="zap" size={16} color={c.primary} />
            <Text style={styles.startingSoonText}>Game starting soon!</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const c = colors.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { flex: 1, paddingHorizontal: 24 },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: c.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 28,
  },

  title: {
    color: c.foreground,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  subtitle: {
    color: c.mutedForeground,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 28,
  },

  codeCard: {
    backgroundColor: c.card,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: c.primary + "44",
    gap: 12,
  },
  codeLabel: {
    color: c.mutedForeground,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  codeText: {
    color: c.primary,
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    letterSpacing: 8,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.primary + "22",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  copyBtnText: {
    color: c.primary,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  playersCard: {
    backgroundColor: c.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: c.border,
    gap: 0,
  },
  playersTitle: {
    color: c.mutedForeground,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.muted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  playerName: {
    color: c.foreground,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  playerStatus: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  vsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 16,
  },
  vsDivider: { flex: 1, height: 1, backgroundColor: c.border },
  vsText: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },

  waitingHint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
  },
  waitingHintText: {
    flex: 1,
    color: c.mutedForeground,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },

  startingSoon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: c.primary + "22",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: c.primary + "44",
  },
  startingSoonText: {
    color: c.primary,
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
