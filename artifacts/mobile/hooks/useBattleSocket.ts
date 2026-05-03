import { useCallback, useEffect, useRef, useState } from "react";

export interface BattleQuestion {
  id: string;
  question: string;
  options: string[];
  category: string;
  difficulty: string;
  verse?: string;
}

export interface BattlePlayerInfo {
  id: string;
  name: string;
  isMe: boolean;
}

export type BattleStatus =
  | "idle"
  | "connecting"
  | "waiting"
  | "countdown"
  | "playing"
  | "finished"
  | "error"
  | "opponent_left";

export interface BattleState {
  status: BattleStatus;
  roomId: string | null;
  roomCode: string | null;
  players: BattlePlayerInfo[];
  questions: BattleQuestion[];
  currentQuestion: number;
  myScore: number;
  opponentScore: number;
  myCorrect: number;
  opponentCorrect: number;
  opponentAnsweredCurrent: boolean;
  answerResult: {
    correct: boolean;
    pointsEarned: number;
    correctIndex: number;
  } | null;
  winner: "me" | "opponent" | "tie" | null;
  error: string | null;
}

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

export function useBattleSocket() {
  const [state, setState] = useState<BattleState>(INITIAL_STATE);
  const wsRef = useRef<WebSocket | null>(null);
  const stateRef = useRef<BattleState>(INITIAL_STATE);

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateState = useCallback((updates: Partial<BattleState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const connect = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      updateState({ status: "connecting", error: null });

      const url = getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("Connection timed out"));
      }, 8000);

      ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        updateState({ status: "error", error: "Could not connect to server. Please try again." });
        reject(new Error("WebSocket error"));
      };

      ws.onclose = () => {
        if (stateRef.current.status !== "finished" && stateRef.current.status !== "idle") {
          updateState({ status: "error", error: "Connection lost. Please try again." });
        }
      };

      ws.onmessage = (event) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(event.data as string);
        } catch {
          return;
        }
        handleMessage(msg);
      };
    });
  }, []);

  const handleMessage = useCallback((msg: Record<string, unknown>) => {
    const type = msg.type as string;

    if (type === "ROOM_CREATED") {
      updateState({
        status: "waiting",
        roomId: msg.roomId as string,
        roomCode: msg.roomCode as string,
      });
      return;
    }

    if (type === "ROOM_JOINED") {
      updateState({
        status: "waiting",
        roomId: msg.roomId as string,
        roomCode: msg.roomCode as string,
        players: (msg.players as BattlePlayerInfo[]) ?? [],
      });
      return;
    }

    if (type === "PLAYER_JOINED") {
      updateState({
        players: (msg.players as BattlePlayerInfo[]) ?? [],
      });
      return;
    }

    if (type === "GAME_START") {
      updateState({
        status: "playing",
        questions: (msg.questions as BattleQuestion[]) ?? [],
        currentQuestion: 0,
        myScore: 0,
        opponentScore: 0,
        myCorrect: 0,
        opponentCorrect: 0,
        answerResult: null,
        opponentAnsweredCurrent: false,
      });
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
      updateState({
        status: "finished",
        myScore: (msg.myScore as number) ?? 0,
        opponentScore: (msg.opponentScore as number) ?? 0,
        myCorrect: (msg.myCorrect as number) ?? 0,
        opponentCorrect: (msg.opponentCorrect as number) ?? 0,
        winner: msg.winner as "me" | "opponent" | "tie",
      });
      return;
    }

    if (type === "PLAYER_LEFT") {
      updateState({ status: "opponent_left" });
      return;
    }

    if (type === "ERROR") {
      updateState({ error: msg.message as string });
      return;
    }
  }, [updateState]);

  const sendMsg = useCallback((msg: object) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const createRoom = useCallback(async (playerName: string, category: string, difficulty: string) => {
    await connect();
    sendMsg({ type: "CREATE_ROOM", playerName, category, difficulty });
  }, [connect, sendMsg]);

  const joinRoom = useCallback(async (playerName: string, roomCode: string) => {
    await connect();
    sendMsg({ type: "JOIN_ROOM", playerName, roomCode });
  }, [connect, sendMsg]);

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
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    state,
    createRoom,
    joinRoom,
    submitAnswer,
    leaveRoom,
    reset,
  };
}
