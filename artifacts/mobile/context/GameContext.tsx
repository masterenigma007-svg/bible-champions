import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CATEGORIES, Category } from "@/constants/questions";

export interface CategoryScore {
  category: Category;
  correct: number;
  total: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface PlayerStats {
  totalScore: number;
  gamesPlayed: number;
  correctAnswers: number;
  totalAnswers: number;
  currentStreak: number;
  bestStreak: number;
  highScore: number;
  categoryScores: Partial<Record<Category, CategoryScore>>;
  achievements: Achievement[];
  lastPlayedDate: string | null;
}

export interface PlayerProfile {
  name: string;
  email: string;
}

const DEFAULT_STATS: PlayerStats = {
  totalScore: 0,
  gamesPlayed: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  highScore: 0,
  categoryScores: {},
  achievements: [],
  lastPlayedDate: null,
};

const DEFAULT_PROFILE: PlayerProfile = { name: "", email: "" };

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_game", title: "First Steps", description: "Complete your first quiz", icon: "star" },
  { id: "perfect_10", title: "Perfect Score", description: "Score 10/10 in a quiz", icon: "award" },
  { id: "streak_5", title: "On Fire", description: "Answer 5 in a row correctly", icon: "zap" },
  { id: "games_10", title: "Dedicated", description: "Play 10 quizzes", icon: "book-open" },
  { id: "games_50", title: "Scholar", description: "Play 50 quizzes", icon: "graduation-cap" },
  { id: "score_1000", title: "Champion", description: "Reach 1000 total points", icon: "trophy" },
  { id: "all_categories", title: "Well-Rounded", description: "Play in every category", icon: "grid" },
];

interface GameContextType {
  stats: PlayerStats;
  profile: PlayerProfile;
  updateStatsAfterGame: (
    correct: number,
    total: number,
    score: number,
    category: Category
  ) => Promise<void>;
  resetStats: () => Promise<void>;
  setProfile: (name: string, email: string) => Promise<void>;
  isLoading: boolean;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [profile, setProfileState] = useState<PlayerProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [storedStats, storedProfile] = await Promise.all([
        AsyncStorage.getItem("bible_champions_stats"),
        AsyncStorage.getItem("bible_champions_profile"),
      ]);
      if (storedStats) setStats(JSON.parse(storedStats));
      if (storedProfile) setProfileState(JSON.parse(storedProfile));
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const saveStats = async (newStats: PlayerStats) => {
    try {
      await AsyncStorage.setItem("bible_champions_stats", JSON.stringify(newStats));
    } catch {
      // ignore
    }
  };

  const setProfile = async (name: string, email: string) => {
    const p: PlayerProfile = { name: name.trim(), email: email.trim() };
    setProfileState(p);
    try {
      await AsyncStorage.setItem("bible_champions_profile", JSON.stringify(p));
    } catch {
      // ignore
    }
  };

  const checkAchievements = (newStats: PlayerStats): Achievement[] => {
    const unlocked: Achievement[] = [];
    const existingIds = new Set(newStats.achievements.map((a) => a.id));

    for (const ach of ACHIEVEMENTS) {
      if (existingIds.has(ach.id)) continue;
      let earned = false;

      if (ach.id === "first_game" && newStats.gamesPlayed >= 1) earned = true;
      if (ach.id === "perfect_10" && newStats.highScore >= 1000) earned = true;
      if (ach.id === "streak_5" && newStats.bestStreak >= 5) earned = true;
      if (ach.id === "games_10" && newStats.gamesPlayed >= 10) earned = true;
      if (ach.id === "games_50" && newStats.gamesPlayed >= 50) earned = true;
      if (ach.id === "score_1000" && newStats.totalScore >= 1000) earned = true;
      if (ach.id === "all_categories") {
        const playedCategories = Object.keys(newStats.categoryScores);
        earned = CATEGORIES.every((c) => playedCategories.includes(c));
      }

      if (earned) {
        unlocked.push({ ...ach, unlockedAt: new Date().toISOString() });
      }
    }
    return unlocked;
  };

  const updateStatsAfterGame = useCallback(
    async (correct: number, total: number, score: number, category: Category) => {
      setStats((prev) => {
        const today = new Date().toDateString();
        const lastPlayed = prev.lastPlayedDate ? new Date(prev.lastPlayedDate).toDateString() : null;
        const isConsecutiveDay =
          lastPlayed === new Date(Date.now() - 86400000).toDateString();
        const newStreak = isConsecutiveDay ? prev.currentStreak + 1 : lastPlayed === today ? prev.currentStreak : 1;

        const prevCat = prev.categoryScores[category] ?? { category, correct: 0, total: 0 };
        const newCategoryScores: Partial<Record<Category, CategoryScore>> = {
          ...prev.categoryScores,
          [category]: {
            category,
            correct: prevCat.correct + correct,
            total: prevCat.total + total,
          },
        };

        const newStats: PlayerStats = {
          ...prev,
          totalScore: prev.totalScore + score,
          gamesPlayed: prev.gamesPlayed + 1,
          correctAnswers: prev.correctAnswers + correct,
          totalAnswers: prev.totalAnswers + total,
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          highScore: Math.max(prev.highScore, score),
          categoryScores: newCategoryScores,
          lastPlayedDate: new Date().toISOString(),
          achievements: prev.achievements,
        };

        const newAchievements = checkAchievements(newStats);
        newStats.achievements = [...prev.achievements, ...newAchievements];

        saveStats(newStats);
        return newStats;
      });
    },
    []
  );

  const resetStats = async () => {
    setStats(DEFAULT_STATS);
    await saveStats(DEFAULT_STATS);
  };

  return (
    <GameContext.Provider value={{ stats, profile, updateStatsAfterGame, resetStats, setProfile, isLoading }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
