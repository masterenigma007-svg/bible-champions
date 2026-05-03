import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { logger } from "../lib/logger.js";
import {
  broadcastToRoom,
  createRoom,
  deleteRoom,
  getOpponent,
  getRoomByPlayerId,
  joinRoom,
  removePlayer,
  sendToPlayer,
  type BattleRoom,
} from "./room-manager.js";

export const wss = new WebSocketServer({ noServer: true });

const QUESTION_TIMEOUT_MS = 17000; // 15s timer + 2s buffer
const REVEAL_DELAY_MS = 1800; // time to show answer before next question
const POINTS = { easy: 100, medium: 200, hard: 300 };
const TIME_BONUS_MAX = 50;

function generatePlayerId(): string {
  return Math.random().toString(36).slice(2, 12);
}

function send(ws: WebSocket, msg: object): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function startGame(room: BattleRoom): void {
  room.state = "playing";
  room.currentQuestion = 0;

  const questionData = room.questions.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    category: q.category,
    difficulty: q.difficulty,
    verse: q.verse,
  }));

  broadcastToRoom(room, {
    type: "GAME_START",
    questions: questionData,
    category: room.category,
    difficulty: room.difficulty,
  });

  scheduleQuestionTimeout(room, 0);
}

function scheduleQuestionTimeout(room: BattleRoom, questionIndex: number): void {
  if (room.questionTimers.has(questionIndex)) return;

  const timer = setTimeout(() => {
    // Auto-submit for players who haven't answered
    for (const player of room.players) {
      if (!player.answeredQuestions.has(questionIndex)) {
        player.answeredQuestions.add(questionIndex);
        sendToPlayer(player, {
          type: "ANSWER_RESULT",
          questionIndex,
          correct: false,
          pointsEarned: 0,
          myScore: player.score,
          opponentScore: getOpponent(room, player.id)?.score ?? 0,
          correctIndex: room.questions[questionIndex]?.correctIndex ?? 0,
          timedOut: true,
        });
      }
    }
    checkBothAnswered(room, questionIndex);
  }, QUESTION_TIMEOUT_MS);

  room.questionTimers.set(questionIndex, timer);
}

function checkBothAnswered(room: BattleRoom, questionIndex: number): void {
  const allAnswered = room.players.every((p) =>
    p.answeredQuestions.has(questionIndex)
  );

  if (!allAnswered) return;

  // Clear question timeout since both answered
  const t = room.questionTimers.get(questionIndex);
  if (t) {
    clearTimeout(t);
    room.questionTimers.delete(questionIndex);
  }

  // Wait then advance to next question
  room.nextQuestionTimer = setTimeout(() => {
    const nextIndex = questionIndex + 1;
    if (nextIndex >= room.questions.length) {
      endGame(room);
    } else {
      room.currentQuestion = nextIndex;
      broadcastToRoom(room, { type: "NEXT_QUESTION", questionIndex: nextIndex });
      scheduleQuestionTimeout(room, nextIndex);
    }
  }, REVEAL_DELAY_MS);
}

function endGame(room: BattleRoom): void {
  room.state = "finished";

  const [p1, p2] = room.players;
  if (!p1) { deleteRoom(room.id); return; }

  const sendResult = (me: typeof p1, opp: typeof p1 | undefined) => {
    const myScore = me.score;
    const oppScore = opp?.score ?? 0;
    let winner: "me" | "opponent" | "tie";
    if (myScore > oppScore) winner = "me";
    else if (myScore < oppScore) winner = "opponent";
    else winner = "tie";

    sendToPlayer(me, {
      type: "GAME_OVER",
      myScore,
      opponentScore: oppScore,
      winner,
      myCorrect: me.correct,
      opponentCorrect: opp?.correct ?? 0,
      totalQuestions: room.questions.length,
    });
  };

  sendResult(p1, p2);
  if (p2) sendResult(p2, p1);

  // Clean up room after a delay
  setTimeout(() => deleteRoom(room.id), 30000);
}

wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
  const playerId = generatePlayerId();
  logger.info({ playerId }, "Battle WS connected");

  ws.on("message", (raw) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: "ERROR", message: "Invalid message format" });
      return;
    }

    const type = msg.type as string;

    if (type === "CREATE_ROOM") {
      const playerName = (msg.playerName as string) || "Player 1";
      const category = (msg.category as string) || "random";
      const difficulty = (msg.difficulty as string) || "easy";

      const room = createRoom(
        { id: playerId, name: playerName, ws },
        category,
        difficulty
      );

      send(ws, {
        type: "ROOM_CREATED",
        roomId: room.id,
        roomCode: room.code,
      });

      logger.info({ playerId, roomCode: room.code }, "Room created");
      return;
    }

    if (type === "JOIN_ROOM") {
      const code = (msg.roomCode as string)?.toUpperCase();
      const playerName = (msg.playerName as string) || "Player 2";

      const result = joinRoom(code, { id: playerId, name: playerName, ws });
      if (result.error) {
        send(ws, { type: "ERROR", message: result.error });
        return;
      }

      const room = result.room!;
      const playerList = room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isMe: p.id === playerId,
      }));

      // Tell the joiner about the room
      send(ws, {
        type: "ROOM_JOINED",
        roomId: room.id,
        roomCode: room.code,
        players: playerList,
      });

      // Notify all players that someone joined
      broadcastToRoom(room, {
        type: "PLAYER_JOINED",
        players: playerList,
      });

      logger.info({ playerId, roomCode: room.code }, "Player joined room");

      // Auto-start when 2 players are in
      if (room.players.length === 2) {
        setTimeout(() => startGame(room), 1000);
      }
      return;
    }

    if (type === "SUBMIT_ANSWER") {
      const room = getRoomByPlayerId(playerId);
      if (!room || room.state !== "playing") return;

      const questionIndex = msg.questionIndex as number;
      const answerIndex = msg.answerIndex as number;
      const timeLeft = (msg.timeLeft as number) ?? 0;

      const player = room.players.find((p) => p.id === playerId);
      if (!player || player.answeredQuestions.has(questionIndex)) return;

      player.answeredQuestions.add(questionIndex);

      const question = room.questions[questionIndex];
      if (!question) return;

      const correct = answerIndex === question.correctIndex;
      let pointsEarned = 0;
      if (correct) {
        const base = POINTS[question.difficulty] ?? 100;
        const timeBonus = Math.round((timeLeft / 15) * TIME_BONUS_MAX);
        pointsEarned = base + timeBonus;
        player.score += pointsEarned;
        player.correct += 1;
      }

      const opponent = getOpponent(room, playerId);

      // Tell this player the result
      sendToPlayer(player, {
        type: "ANSWER_RESULT",
        questionIndex,
        correct,
        pointsEarned,
        myScore: player.score,
        opponentScore: opponent?.score ?? 0,
        correctIndex: question.correctIndex,
      });

      // Tell opponent that this player answered (not revealing the answer)
      if (opponent) {
        sendToPlayer(opponent, {
          type: "OPPONENT_ANSWERED",
          questionIndex,
          opponentScore: player.score,
        });
      }

      checkBothAnswered(room, questionIndex);
      return;
    }

    if (type === "LEAVE_ROOM") {
      handlePlayerLeave(ws, playerId);
      return;
    }

    if (type === "PING") {
      send(ws, { type: "PONG" });
      return;
    }
  });

  ws.on("close", () => {
    logger.info({ playerId }, "Battle WS disconnected");
    handlePlayerLeave(ws, playerId);
  });

  ws.on("error", (err) => {
    logger.error({ playerId, err }, "Battle WS error");
  });
});

function handlePlayerLeave(ws: WebSocket, playerId: string): void {
  const room = getRoomByPlayerId(playerId);
  if (!room) return;

  removePlayer(playerId);

  // Notify remaining players
  for (const p of room.players) {
    sendToPlayer(p, { type: "PLAYER_LEFT" });
  }

  if (room.players.length === 0) {
    deleteRoom(room.id);
  }
}
