import { CrosswordWord } from "@/constants/crosswordWords";

export type Direction = "across" | "down";

export type Placement = {
  word: string;
  clue: string;
  row: number;
  col: number;
  dir: Direction;
  number: number;
};

export type CrosswordLayout = {
  rows: number;
  cols: number;
  grid: (string | null)[][];
  numbers: Record<string, number>;
  placements: Placement[];
  unplaced: string[];
};

function seededRandom(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canPlace(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  dir: Direction,
): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  let intersections = 0;

  for (let i = 0; i < word.length; i++) {
    const r = dir === "down" ? row + i : row;
    const c = dir === "across" ? col + i : col;
    if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
    const cur = grid[r][c];
    if (cur !== null && cur !== word[i]) return false;
    if (cur === word[i]) {
      intersections++;
    } else {
      // empty cell — check perpendicular neighbors are empty
      if (dir === "across") {
        if (r > 0 && grid[r - 1][c] !== null) return false;
        if (r < rows - 1 && grid[r + 1][c] !== null) return false;
      } else {
        if (c > 0 && grid[r][c - 1] !== null) return false;
        if (c < cols - 1 && grid[r][c + 1] !== null) return false;
      }
    }
  }
  // Ends must be empty
  if (dir === "across") {
    if (col > 0 && grid[row][col - 1] !== null) return false;
    if (col + word.length < cols && grid[row][col + word.length] !== null)
      return false;
  } else {
    if (row > 0 && grid[row - 1][col] !== null) return false;
    if (row + word.length < rows && grid[row + word.length][col] !== null)
      return false;
  }
  return intersections >= 1; // must intersect at least once after first word
}

function placeWord(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  dir: Direction,
) {
  for (let i = 0; i < word.length; i++) {
    const r = dir === "down" ? row + i : row;
    const c = dir === "across" ? col + i : col;
    grid[r][c] = word[i];
  }
}

export function generateCrossword(
  words: CrosswordWord[],
  variation: number,
  count: number,
): CrosswordLayout {
  const SIZE = 18;
  const rnd = seededRandom(variation * 7919 + 31);

  const pool = shuffle(words, rnd)
    .slice(0, count)
    .sort((a, b) => b.word.length - a.word.length);

  const grid: (string | null)[][] = Array.from({ length: SIZE }, () =>
    Array<string | null>(SIZE).fill(null),
  );
  const placements: Placement[] = [];
  const unplaced: string[] = [];

  // Seed: place longest word horizontally near center
  const first = pool[0];
  const firstRow = Math.floor(SIZE / 2);
  const firstCol = Math.floor((SIZE - first.word.length) / 2);
  placeWord(grid, first.word, firstRow, firstCol, "across");
  placements.push({
    word: first.word,
    clue: first.clue,
    row: firstRow,
    col: firstCol,
    dir: "across",
    number: 0,
  });

  for (let i = 1; i < pool.length; i++) {
    const entry = pool[i];
    type Cand = { row: number; col: number; dir: Direction; score: number };
    const candidates: Cand[] = [];

    for (const p of placements) {
      for (let li = 0; li < entry.word.length; li++) {
        for (let pi = 0; pi < p.word.length; pi++) {
          if (entry.word[li] !== p.word[pi]) continue;
          let row: number;
          let col: number;
          let newDir: Direction;
          if (p.dir === "across") {
            newDir = "down";
            row = p.row - li;
            col = p.col + pi;
          } else {
            newDir = "across";
            row = p.row + pi;
            col = p.col - li;
          }
          if (canPlace(grid, entry.word, row, col, newDir)) {
            candidates.push({
              row,
              col,
              dir: newDir,
              score: Math.abs(SIZE / 2 - row) + Math.abs(SIZE / 2 - col),
            });
          }
        }
      }
    }

    if (candidates.length === 0) {
      unplaced.push(entry.word);
      continue;
    }
    // Bias toward center but keep variation by sampling top half
    candidates.sort((a, b) => a.score - b.score);
    const topN = Math.max(1, Math.ceil(candidates.length / 2));
    const choice = candidates[Math.floor(rnd() * topN)];
    placeWord(grid, entry.word, choice.row, choice.col, choice.dir);
    placements.push({
      word: entry.word,
      clue: entry.clue,
      row: choice.row,
      col: choice.col,
      dir: choice.dir,
      number: 0,
    });
  }

  // Crop
  let minR = SIZE,
    maxR = -1,
    minC = SIZE,
    maxC = -1;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] !== null) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }
  const cropped = grid.slice(minR, maxR + 1).map((row) => row.slice(minC, maxC + 1));
  const rows = cropped.length;
  const cols = cropped[0].length;

  const adjusted = placements.map((p) => ({
    ...p,
    row: p.row - minR,
    col: p.col - minC,
  }));

  // Number cells
  const numbers: Record<string, number> = {};
  let nextNum = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (cropped[r][c] === null) continue;
      const startsAcross =
        (c === 0 || cropped[r][c - 1] === null) &&
        c + 1 < cols &&
        cropped[r][c + 1] !== null;
      const startsDown =
        (r === 0 || cropped[r - 1][c] === null) &&
        r + 1 < rows &&
        cropped[r + 1][c] !== null;
      if (startsAcross || startsDown) {
        numbers[`${r},${c}`] = nextNum++;
      }
    }
  }

  for (const p of adjusted) {
    p.number = numbers[`${p.row},${p.col}`] ?? 0;
  }
  adjusted.sort((a, b) => a.number - b.number);

  return {
    rows,
    cols,
    grid: cropped,
    numbers,
    placements: adjusted,
    unplaced,
  };
}
