import { WebSocket } from "ws";
import { QuestionMeta, pickQuestions } from "./questions-data.js";

export interface BattlePlayer {
  id: string;
  name: string;
  ws: WebSocket;
  score: number;
  correct: number;
  answeredQuestions: Set<number>;
}

export interface BattleRoom {
  id: string;
  code: string;
  players: BattlePlayer[];
  questions: QuestionMeta[];
  state: "waiting" | "playing" | "finished";
  currentQuestion: number;
  category: string;
  difficulty: string;
  questionTimers: Map<number, ReturnType<typeof setTimeout>>;
  nextQuestionTimer: ReturnType<typeof setTimeout> | null;
}

const rooms = new Map<string, BattleRoom>();
const roomsByCode = new Map<string, string>(); // code -> roomId
const playerRooms = new Map<string, string>(); // playerId -> roomId

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createRoom(
  player: Omit<BattlePlayer, "score" | "correct" | "answeredQuestions">,
  category: string,
  difficulty: string
): BattleRoom {
  const id = generateId();
  let code = generateCode();
  while (roomsByCode.has(code)) code = generateCode();

  const questions = pickQuestions(category, difficulty, 10);

  const room: BattleRoom = {
    id,
    code,
    players: [
      {
        ...player,
        score: 0,
        correct: 0,
        answeredQuestions: new Set(),
      },
    ],
    questions,
    state: "waiting",
    currentQuestion: 0,
    category,
    difficulty,
    questionTimers: new Map(),
    nextQuestionTimer: null,
  };

  rooms.set(id, room);
  roomsByCode.set(code, id);
  playerRooms.set(player.id, id);

  return room;
}

export function joinRoom(
  code: string,
  player: Omit<BattlePlayer, "score" | "correct" | "answeredQuestions">
): { room: BattleRoom; error?: never } | { room?: never; error: string } {
  const roomId = roomsByCode.get(code.toUpperCase());
  if (!roomId) return { error: "Room not found. Check the code and try again." };

  const room = rooms.get(roomId);
  if (!room) return { error: "Room not found." };
  if (room.state !== "waiting") return { error: "This game has already started." };
  if (room.players.length >= 2) return { error: "This room is full." };

  room.players.push({
    ...player,
    score: 0,
    correct: 0,
    answeredQuestions: new Set(),
  });
  playerRooms.set(player.id, roomId);
  return { room };
}

export function getRoomByPlayerId(playerId: string): BattleRoom | undefined {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return undefined;
  return rooms.get(roomId);
}

export function removePlayer(playerId: string): BattleRoom | undefined {
  const room = getRoomByPlayerId(playerId);
  if (!room) return undefined;

  playerRooms.delete(playerId);
  room.players = room.players.filter((p) => p.id !== playerId);

  if (room.players.length === 0) {
    deleteRoom(room.id);
  }

  return room;
}

export function deleteRoom(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  room.questionTimers.forEach((t) => clearTimeout(t));
  if (room.nextQuestionTimer) clearTimeout(room.nextQuestionTimer);
  roomsByCode.delete(room.code);
  room.players.forEach((p) => playerRooms.delete(p.id));
  rooms.delete(roomId);
}

export function sendToPlayer(player: BattlePlayer, msg: object): void {
  if (player.ws.readyState === WebSocket.OPEN) {
    player.ws.send(JSON.stringify(msg));
  }
}

export function broadcastToRoom(room: BattleRoom, msg: object): void {
  for (const p of room.players) {
    sendToPlayer(p, msg);
  }
}

export function getOpponent(room: BattleRoom, playerId: string): BattlePlayer | undefined {
  return room.players.find((p) => p.id !== playerId);
}
