import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from "react";
import type { BattleState, BattleQuestion, BattlePlayerInfo } from "@/hooks/useBattleSocket";

export type { BattleState, BattleQuestion, BattlePlayerInfo };

const INITIAL_STATE: BattleState = {
  status: "idle",
  roomId: null,
  roomCode: null,
  players: [],
  questions: [],
  currentQuestion: 0,
  myScore: 0,
  opponentScore: 0,
  myCorrect: 0,
  opponentCorrect: 0,
  opponentAnsweredCurrent: false,
  answerResult: null,
  winner: null,
  error: null,
};

function getWsUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) return "ws://localhost:8080/api/battle/ws";
  return `wss://${domain}/api/battle/ws`;
}

interface BattleContextType {
  state: BattleState;
  createRoom: (playerName: string, category: string, difficulty: string) => Promise<void>;
  joinRoom: (playerName: string, roomCode: string) => Promise<void>;
  submitAnswer: (questionIndex: number, answerIndex: number, timeLeft: number) => void;
  leaveRoom: () => void;
  reset: () => void;
}

const BattleContext = createContext<BattleContextType | null>(null);

export function BattleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BattleState>(INITIAL_STATE);
  const wsRef = useRef<WebSocket | null>(null);
  const stateRef = useRef<BattleState>(INITIAL_STATE);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateState = useCallback((updates: Partial<BattleState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleMessage = useCallback((msg: Record<string, unknown>) => {
    const type = msg.type as string;

    if (type === "ROOM_CREATED") {
      setState((prev) => ({ ...prev, status: "waiting", roomId: msg.roomId as string, roomCode: msg.roomCode as string }));
      return;
    }
    if (type === "ROOM_JOINED") {
      setState((prev) => ({
        ...prev,
        status: "waiting",
        roomId: msg.roomId as string,
        roomCode: msg.roomCode as string,
        players: (msg.players as BattlePlayerInfo[]) ?? [],
      }));
      return;
    }
    if (type === "PLAYER_JOINED") {
      setState((prev) => ({ ...prev, players: (msg.players as BattlePlayerInfo[]) ?? [] }));
      return;
    }
    if (type === "GAME_START") {
      setState((prev) => ({
        ...prev,
        status: "playing",
        questions: (msg.questions as BattleQuestion[]) ?? [],
        currentQuestion: 0,
        myScore: 0,
        opponentScore: 0,
        myCorrect: 0,
        opponentCorrect: 0,
        answerResult: null,
        opponentAnsweredCurrent: false,
      }));
      return;
    }
    if (type === "OPPONENT_ANSWERED") {
      const qi = msg.questionIndex as number;
      setState((prev) => {
        if (qi === prev.currentQuestion) {
          return { ...prev, opponentAnsweredCurrent: true, opponentScore: (msg.opponentScore as number) ?? prev.opponentScore };
        }
        return prev;
      });
      return;
    }
    if (type === "ANSWER_RESULT") {
      setState((prev) => ({
        ...prev,
        myScore: (msg.myScore as number) ?? prev.myScore,
        opponentScore: (msg.opponentScore as number) ?? prev.opponentScore,
        myCorrect: (msg.correct as boolean) ? prev.myCorrect + 1 : prev.myCorrect,
        answerResult: {
          correct: msg.correct as boolean,
          pointsEarned: (msg.pointsEarned as number) ?? 0,
          correctIndex: (msg.correctIndex as number) ?? 0,
        },
      }));
      return;
    }
    if (type === "NEXT_QUESTION") {
      const qi = msg.questionIndex as number;
      setState((prev) => ({
        ...prev,
        currentQuestion: qi,
        answerResult: null,
        opponentAnsweredCurrent: false,
      }));
      return;
    }
    if (type === "GAME_OVER") {
      setState((prev) => ({
        ...prev,
        status: "finished",
        myScore: (msg.myScore as number) ?? prev.myScore,
        opponentScore: (msg.opponentScore as number) ?? prev.opponentScore,
        myCorrect: (msg.myCorrect as number) ?? prev.myCorrect,
        opponentCorrect: (msg.opponentCorrect as number) ?? prev.opponentCorrect,
        winner: msg.winner as "me" | "opponent" | "tie",
      }));
      return;
    }
    if (type === "PLAYER_LEFT") {
      setState((prev) => ({ ...prev, status: "opponent_left" }));
      return;
    }
    if (type === "ERROR") {
      setState((prev) => ({ ...prev, error: msg.message as string }));
      return;
    }
  }, []);

  const connectWs = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existing = wsRef.current;
      if (existing && existing.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      setState((prev) => ({ ...prev, status: "connecting", error: null }));

      const url = getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("Connection timed out. Is the API server running?"));
      }, 8000);

      ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "Could not connect to server. Please try again.",
        }));
        reject(new Error("WebSocket connection failed"));
      };

      ws.onclose = () => {
        const s = stateRef.current;
        if (s.status !== "finished" && s.status !== "idle" && s.status !== "error") {
          setState((prev) => ({ ...prev, status: "error", error: "Connection lost. Please try again." }));
        }
      };

      ws.onmessage = (event) => {
        let msg: Record<string, unknown>;
        try { msg = JSON.parse(event.data as string); } catch { return; }
        handleMessage(msg);
      };
    });
  }, [handleMessage]);

  const sendMsg = useCallback((msg: object) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const createRoom = useCallback(async (playerName: string, category: string, difficulty: string) => {
    await connectWs();
    sendMsg({ type: "CREATE_ROOM", playerName, category, difficulty });
  }, [connectWs, sendMsg]);

  const joinRoom = useCallback(async (playerName: string, roomCode: string) => {
    await connectWs();
    sendMsg({ type: "JOIN_ROOM", playerName, roomCode });
  }, [connectWs, sendMsg]);

  const submitAnswer = useCallback((questionIndex: number, answerIndex: number, timeLeft: number) => {
    sendMsg({ type: "SUBMIT_ANSWER", questionIndex, answerIndex, timeLeft });
  }, [sendMsg]);

  const leaveRoom = useCallback(() => {
    sendMsg({ type: "LEAVE_ROOM" });
    wsRef.current?.close();
    wsRef.current = null;
    setState(INITIAL_STATE);
  }, [sendMsg]);

  const reset = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  return (
    <BattleContext.Provider value={{ state, createRoom, joinRoom, submitAnswer, leaveRoom, reset }}>
      {children}
    </BattleContext.Provider>
  );
}

export function useBattle() {
  const ctx = useContext(BattleContext);
  if (!ctx) throw new Error("useBattle must be used within BattleProvider");
  return ctx;
}
