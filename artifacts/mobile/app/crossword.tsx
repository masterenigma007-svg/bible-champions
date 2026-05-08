import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackground from "@/components/ScreenBackground";
import colors from "@/constants/colors";
import { CROSSWORD_WORDS } from "@/constants/crosswordWords";
import {
  CrosswordLayout,
  Direction,
  Placement,
  generateCrossword,
} from "@/lib/crosswordGenerator";

const c = colors.light;

type Selected = { row: number; col: number } | null;

function difficultyToCount(d: number): number {
  // 0 .. 100 → 6 .. 15
  return Math.round(6 + (d / 100) * 9);
}

function difficultyLabel(d: number): { name: string; color: string } {
  if (d < 34) return { name: "Easy", color: "#27AE60" };
  if (d < 67) return { name: "Medium", color: "#F5A623" };
  return { name: "Hard", color: "#E74C3C" };
}

function DiffSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  widthRef.current = width;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const w = widthRef.current;
          if (!w) return;
          const x = e.nativeEvent.locationX;
          onChange(Math.max(0, Math.min(100, (x / w) * 100)));
        },
        onPanResponderMove: (e) => {
          const w = widthRef.current;
          if (!w) return;
          const x = e.nativeEvent.locationX;
          onChange(Math.max(0, Math.min(100, (x / w) * 100)));
        },
      }),
    [onChange],
  );

  const pct = Math.max(0, Math.min(100, value));
  return (
    <View
      style={styles.sliderTrack}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...pan.panHandlers}
    >
      <View style={[styles.sliderFill, { width: `${pct}%` }]} />
      <View style={[styles.sliderThumb, { left: `${pct}%` }]} />
    </View>
  );
}

export default function CrosswordScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 16 : insets.top + 8;

  const [variation, setVariation] = useState(0);
  const [difficulty, setDifficulty] = useState(40);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingDifficulty, setPendingDifficulty] = useState(40);

  const layout: CrosswordLayout = useMemo(
    () => generateCrossword(CROSSWORD_WORDS, variation, difficultyToCount(difficulty)),
    [variation, difficulty],
  );

  const [userGrid, setUserGrid] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Selected>(null);
  const [direction, setDirection] = useState<Direction>("across");

  // Reset entries when puzzle changes
  useEffect(() => {
    setUserGrid({});
    setSelected(null);
  }, [variation, difficulty]);

  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const screenWidth = Dimensions.get("window").width;
  const cellSize = Math.min(
    36,
    Math.floor((Math.min(screenWidth, 520) - 32) / layout.cols),
  );
  const fontSize = Math.max(12, Math.floor(cellSize * 0.5));
  const numFontSize = Math.max(8, Math.floor(cellSize * 0.28));

  // Find current word from selected cell + direction
  const currentClue: Placement | null = useMemo(() => {
    if (!selected) return null;
    const inWord = (p: Placement) => {
      if (p.dir === "across") {
        return (
          p.row === selected.row &&
          selected.col >= p.col &&
          selected.col < p.col + p.word.length
        );
      }
      return (
        p.col === selected.col &&
        selected.row >= p.row &&
        selected.row < p.row + p.word.length
      );
    };
    const matchDir = layout.placements.find((p) => p.dir === direction && inWord(p));
    if (matchDir) return matchDir;
    return layout.placements.find(inWord) ?? null;
  }, [selected, direction, layout]);

  const cellInWord = (r: number, c: number, p: Placement) => {
    if (p.dir === "across") {
      return p.row === r && c >= p.col && c < p.col + p.word.length;
    }
    return p.col === c && r >= p.row && r < p.row + p.word.length;
  };

  const advance = (r: number, c: number) => {
    if (!currentClue) return;
    let nr = r;
    let nc = c;
    if (currentClue.dir === "across") nc += 1;
    else nr += 1;
    if (
      nr < 0 ||
      nc < 0 ||
      nr >= layout.rows ||
      nc >= layout.cols ||
      layout.grid[nr][nc] === null
    ) {
      return;
    }
    const key = `${nr},${nc}`;
    inputRefs.current[key]?.focus();
    setSelected({ row: nr, col: nc });
  };

  const handleCellPress = (r: number, c: number) => {
    if (layout.grid[r][c] === null) return;
    if (selected && selected.row === r && selected.col === c) {
      // toggle direction if cell belongs to both
      const acrossWord = layout.placements.find(
        (p) => p.dir === "across" && cellInWord(r, c, p),
      );
      const downWord = layout.placements.find(
        (p) => p.dir === "down" && cellInWord(r, c, p),
      );
      if (acrossWord && downWord) {
        setDirection((d) => (d === "across" ? "down" : "across"));
      }
    }
    setSelected({ row: r, col: c });
    inputRefs.current[`${r},${c}`]?.focus();
  };

  const handleChange = (r: number, c: number, t: string) => {
    const ch = t.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    setUserGrid((prev) => ({ ...prev, [`${r},${c}`]: ch }));
    if (ch) advance(r, c);
  };

  const checkPuzzle = () => {
    let correct = 0;
    let total = 0;
    for (let r = 0; r < layout.rows; r++) {
      for (let cc = 0; cc < layout.cols; cc++) {
        const target = layout.grid[r][cc];
        if (target === null) continue;
        total++;
        if ((userGrid[`${r},${cc}`] || "") === target) correct++;
      }
    }
    const allCorrect = correct === total;
    Alert.alert(
      allCorrect ? "Well done!" : "Keep going",
      allCorrect
        ? `You solved the puzzle! ${correct}/${total} cells correct.`
        : `${correct}/${total} cells correct so far.`,
    );
  };

  const revealLetter = () => {
    if (!selected) return;
    const target = layout.grid[selected.row][selected.col];
    if (!target) return;
    setUserGrid((prev) => ({ ...prev, [`${selected.row},${selected.col}`]: target }));
  };

  const newPuzzle = () => {
    setVariation((v) => (v + 1) % 12);
  };

  const applySettings = () => {
    setDifficulty(pendingDifficulty);
    setShowSettings(false);
  };

  const acrossClues = layout.placements.filter((p) => p.dir === "across");
  const downClues = layout.placements.filter((p) => p.dir === "down");
  const diffMeta = difficultyLabel(difficulty);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScreenBackground />
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="x" size={22} color={c.foreground} />
        </Pressable>
        <Text style={styles.title}>Bible Crossword</Text>
        <Pressable
          onPress={() => {
            setPendingDifficulty(difficulty);
            setShowSettings((s) => !s);
          }}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="sliders" size={20} color={c.foreground} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {showSettings && (
          <View style={styles.settingsCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.settingsLabel}>Difficulty</Text>
              <View style={[styles.diffPill, { backgroundColor: diffMeta.color + "22" }]}>
                <Text style={[styles.diffPillText, { color: diffMeta.color }]}>
                  {difficultyLabel(pendingDifficulty).name} ·{" "}
                  {difficultyToCount(pendingDifficulty)} words
                </Text>
              </View>
            </View>
            <DiffSlider value={pendingDifficulty} onChange={setPendingDifficulty} />
            <View style={styles.sliderEnds}>
              <Text style={styles.sliderEndText}>Easy</Text>
              <Text style={styles.sliderEndText}>Hard</Text>
            </View>
            <Pressable
              onPress={applySettings}
              style={({ pressed }) => [
                styles.applyBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.applyBtnText}>Apply & Generate</Text>
            </Pressable>
          </View>
        )}

        {/* Current clue banner */}
        <View style={styles.clueBanner}>
          {currentClue ? (
            <>
              <Text style={styles.clueNumber}>
                {currentClue.number} {currentClue.dir === "across" ? "Across" : "Down"}
              </Text>
              <Text style={styles.clueText}>{currentClue.clue}</Text>
            </>
          ) : (
            <Text style={styles.clueText}>Tap any cell to start solving</Text>
          )}
        </View>

        {/* Grid */}
        <View style={styles.gridWrap}>
          <View
            style={{
              width: cellSize * layout.cols,
              alignSelf: "center",
            }}
          >
            {Array.from({ length: layout.rows }).map((_, r) => (
              <View key={r} style={{ flexDirection: "row" }}>
                {Array.from({ length: layout.cols }).map((__, cc) => {
                  const target = layout.grid[r][cc];
                  if (target === null) {
                    return (
                      <View
                        key={cc}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: "transparent",
                        }}
                      />
                    );
                  }
                  const key = `${r},${cc}`;
                  const num = layout.numbers[key];
                  const isSelected =
                    selected && selected.row === r && selected.col === cc;
                  const inCurrent =
                    currentClue && cellInWord(r, cc, currentClue);
                  const value = userGrid[key] || "";
                  return (
                    <Pressable
                      key={cc}
                      onPress={() => handleCellPress(r, cc)}
                      style={[
                        styles.cell,
                        {
                          width: cellSize,
                          height: cellSize,
                        },
                        inCurrent && !isSelected && styles.cellHighlight,
                        isSelected && styles.cellSelected,
                      ]}
                    >
                      {num ? (
                        <Text style={[styles.cellNum, { fontSize: numFontSize }]}>
                          {num}
                        </Text>
                      ) : null}
                      <TextInput
                        ref={(el) => {
                          inputRefs.current[key] = el;
                        }}
                        value={value}
                        onChangeText={(t) => handleChange(r, cc, t)}
                        onFocus={() => setSelected({ row: r, col: cc })}
                        maxLength={1}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        selectTextOnFocus
                        style={[
                          styles.cellInput,
                          {
                            fontSize,
                            height: cellSize,
                            width: cellSize,
                          },
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Action row */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={newPuzzle}
            style={({ pressed }) => [
              styles.actionBtn,
              { borderColor: c.primary + "55" },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Feather name="refresh-cw" size={14} color={c.primary} />
            <Text style={[styles.actionBtnText, { color: c.primary }]}>New</Text>
          </Pressable>
          <Pressable
            onPress={revealLetter}
            style={({ pressed }) => [
              styles.actionBtn,
              { borderColor: "#6366F155" },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Feather name="eye" size={14} color="#6366F1" />
            <Text style={[styles.actionBtnText, { color: "#6366F1" }]}>
              Reveal
            </Text>
          </Pressable>
          <Pressable
            onPress={checkPuzzle}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionBtnPrimary,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Feather name="check" size={14} color="#FFF" />
            <Text style={[styles.actionBtnText, { color: "#FFF" }]}>Check</Text>
          </Pressable>
        </View>

        {/* Clue lists */}
        <View style={styles.clueColumns}>
          <View style={styles.clueColumn}>
            <Text style={styles.clueColumnTitle}>ACROSS</Text>
            {acrossClues.map((p) => {
              const active = currentClue?.number === p.number && currentClue?.dir === "across";
              return (
                <Pressable
                  key={`a-${p.number}`}
                  onPress={() => {
                    setDirection("across");
                    setSelected({ row: p.row, col: p.col });
                    inputRefs.current[`${p.row},${p.col}`]?.focus();
                  }}
                  style={[styles.clueRow, active && styles.clueRowActive]}
                >
                  <Text style={[styles.clueRowNum, active && { color: c.primary }]}>
                    {p.number}
                  </Text>
                  <Text style={styles.clueRowText} numberOfLines={2}>
                    {p.clue}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.clueColumn}>
            <Text style={styles.clueColumnTitle}>DOWN</Text>
            {downClues.map((p) => {
              const active = currentClue?.number === p.number && currentClue?.dir === "down";
              return (
                <Pressable
                  key={`d-${p.number}`}
                  onPress={() => {
                    setDirection("down");
                    setSelected({ row: p.row, col: p.col });
                    inputRefs.current[`${p.row},${p.col}`]?.focus();
                  }}
                  style={[styles.clueRow, active && styles.clueRowActive]}
                >
                  <Text style={[styles.clueRowNum, active && { color: c.primary }]}>
                    {p.number}
                  </Text>
                  <Text style={styles.clueRowText} numberOfLines={2}>
                    {p.clue}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: c.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.border,
  },
  title: {
    color: c.foreground,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  scrollContent: { paddingHorizontal: 16 },

  settingsCard: {
    backgroundColor: c.cardElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingsLabel: {
    color: c.foreground,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  diffPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  diffPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  sliderTrack: {
    height: 28,
    justifyContent: "center",
    paddingVertical: 12,
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    height: 6,
    backgroundColor: c.primary,
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFF",
    borderWidth: 3,
    borderColor: c.primary,
    marginLeft: -11,
    top: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sliderEnds: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
  sliderEndText: {
    fontSize: 11,
    color: c.mutedForeground,
    fontFamily: "Inter_500Medium",
  },
  applyBtn: {
    backgroundColor: c.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  applyBtnText: {
    color: "#FFF",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },

  clueBanner: {
    backgroundColor: c.cardElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: c.primary + "33",
    marginBottom: 12,
  },
  clueNumber: {
    color: c.primary,
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  clueText: {
    color: c.foreground,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },

  gridWrap: {
    backgroundColor: c.cardElevated,
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 12,
  },
  cell: {
    backgroundColor: "#FFF",
    borderWidth: 0.5,
    borderColor: "#9CB7D1",
    alignItems: "center",
    justifyContent: "center",
  },
  cellHighlight: { backgroundColor: "#FFF3D6" },
  cellSelected: { backgroundColor: "#FFE0A8" },
  cellNum: {
    position: "absolute",
    top: 1,
    left: 2,
    color: c.foreground,
    fontFamily: "Inter_600SemiBold",
  },
  cellInput: {
    color: c.foreground,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    padding: 0,
  },

  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: c.card,
    borderWidth: 1.5,
  },
  actionBtnPrimary: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  actionBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },

  clueColumns: {
    flexDirection: "row",
    gap: 10,
  },
  clueColumn: {
    flex: 1,
    backgroundColor: c.cardElevated,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  clueColumnTitle: {
    color: c.mutedForeground,
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
  },
  clueRow: {
    flexDirection: "row",
    paddingVertical: 6,
    gap: 6,
    borderRadius: 6,
  },
  clueRowActive: {
    backgroundColor: c.primary + "18",
    paddingHorizontal: 6,
    marginHorizontal: -6,
  },
  clueRowNum: {
    color: c.foreground,
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    minWidth: 18,
  },
  clueRowText: {
    flex: 1,
    color: c.foreground,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
});
