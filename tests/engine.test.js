import { describe, expect, it } from "vitest";
import {
  BOARD_COLS,
  BOARD_HIDDEN_ROWS,
  BOARD_ROWS,
} from "../html5/src/js/core/constants.js";
import {
  clearCompletedLines,
  collides,
  createBoard,
  createInitialState,
  gameReducer,
  projectBoardWithActivePiece,
} from "../html5/src/js/core/engine.js";

const withState = (override = {}) => ({
  ...createInitialState(7),
  ...override,
});

describe("engine board operations", () => {
  it("creates empty board dimensions", () => {
    const board = createBoard();
    expect(board).toHaveLength(BOARD_ROWS);
    expect(board[0]).toHaveLength(BOARD_COLS);
    expect(board.flat().every((cell) => cell === null)).toBe(true);
  });

  it("detects collisions at walls, floor and occupied cells", () => {
    const board = createBoard();
    board[5][4] = "I";

    expect(collides(board, { type: "O", rotation: 0, x: -2, y: 0 })).toBe(true);
    expect(
      collides(board, { type: "I", rotation: 1, x: 8, y: BOARD_ROWS - 3 }),
    ).toBe(true);
    expect(collides(board, { type: "O", rotation: 0, x: 3, y: 4 })).toBe(true);
    expect(collides(board, { type: "O", rotation: 0, x: 3, y: 0 })).toBe(false);
  });

  it("clears completed lines and keeps board size", () => {
    const board = createBoard();
    board[BOARD_ROWS - 1] = Array.from({ length: BOARD_COLS }, () => "T");
    board[BOARD_ROWS - 2] = Array.from({ length: BOARD_COLS }, () => "L");
    board[BOARD_ROWS - 3][0] = "I";

    const cleared = clearCompletedLines(board);
    expect(cleared.clearedLines).toBe(2);
    expect(cleared.board).toHaveLength(BOARD_ROWS);
    expect(cleared.board[BOARD_ROWS - 1][0]).toBe("I");
    expect(cleared.board[0].every((cell) => cell === null)).toBe(true);
    expect(cleared.board[1].every((cell) => cell === null)).toBe(true);
  });
});

describe("engine reducer", () => {
  it("builds deterministic initial state", () => {
    const first = createInitialState(1234);
    const second = createInitialState(1234);
    expect(first).toEqual(second);
    expect(first.queue).toHaveLength(3);
    expect(first.active.type).toBeTypeOf("string");
  });

  it("moves piece left and right", () => {
    const initial = createInitialState(22);
    const left = gameReducer(initial, { type: "MOVE_LEFT" });
    const right = gameReducer(left, { type: "MOVE_RIGHT" });

    expect(left.active.x).toBe(initial.active.x - 1);
    expect(right.active.x).toBe(initial.active.x);
  });

  it("prevents movement when blocked by occupied cell", () => {
    const board = createBoard();
    const active = { type: "O", rotation: 0, x: 3, y: 3 };
    board[3][3] = "Z";
    const initial = withState({ board, active });
    const moved = gameReducer(initial, { type: "MOVE_LEFT" });
    expect(moved).toEqual(initial);
  });

  it("moves down using MOVE_DOWN", () => {
    const initial = createInitialState(22);
    const moved = gameReducer(initial, { type: "MOVE_DOWN" });
    expect(moved.active.y).toBe(initial.active.y + 1);
  });

  it("rotates both directions", () => {
    const initial = withState({
      active: { type: "T", rotation: 0, x: 4, y: 2 },
    });
    const left = gameReducer(initial, { type: "ROTATE_LEFT" });
    const right = gameReducer(left, { type: "ROTATE_RIGHT" });

    expect(left.active.rotation).toBe(3);
    expect(right.active.rotation).toBe(0);
  });

  it("uses wall kick when rotating near wall", () => {
    const initial = withState({
      active: { type: "I", rotation: 1, x: 8, y: 3 },
    });
    const rotated = gameReducer(initial, { type: "ROTATE_RIGHT" });
    expect(rotated.active.rotation).toBe(2);
    expect(rotated.active.x).toBeLessThanOrEqual(initial.active.x);
  });

  it("keeps orientation when rotation remains blocked", () => {
    const board = createBoard();
    for (let y = 0; y < BOARD_ROWS; y += 1) {
      board[y][0] = "L";
      board[y][1] = "L";
      board[y][2] = "L";
      board[y][3] = "L";
      board[y][4] = "L";
      board[y][5] = "L";
    }
    const initial = withState({
      board,
      active: { type: "T", rotation: 0, x: 1, y: 1 },
    });
    const rotated = gameReducer(initial, { type: "ROTATE_RIGHT" });
    expect(rotated).toEqual(initial);
  });

  it("ignores transforms when paused", () => {
    const initial = withState({ isPaused: true });
    const moved = gameReducer(initial, { type: "MOVE_LEFT" });
    const dropped = gameReducer(initial, { type: "TICK" });
    const rotated = gameReducer(initial, { type: "ROTATE_RIGHT" });

    expect(moved).toEqual(initial);
    expect(dropped).toEqual(initial);
    expect(rotated).toEqual(initial);
  });

  it("locks piece and spawns next piece after ground contact", () => {
    const initial = withState({
      active: { type: "O", rotation: 0, x: 4, y: BOARD_ROWS - 2 },
    });
    const locked = gameReducer(initial, { type: "TICK" });

    expect(locked.active.y).toBe(0);
    expect(locked.queue).toHaveLength(3);
    expect(locked.board.flat().some((cell) => cell !== null)).toBe(true);
  });

  it("awards score when clearing lines", () => {
    const board = createBoard();
    board[BOARD_ROWS - 1] = Array.from({ length: BOARD_COLS }, () => "J");
    board[BOARD_ROWS - 1][4] = null;

    const initial = withState({
      board,
      active: { type: "I", rotation: 1, x: 2, y: BOARD_ROWS - 5 },
      score: 0,
      lines: 0,
    });

    const dropped = gameReducer(initial, { type: "HARD_DROP" });
    expect(dropped.lines).toBe(1);
    expect(dropped.score).toBe(100);
  });

  it("toggles pause unless game is over", () => {
    const state = createInitialState(8);
    const paused = gameReducer(state, { type: "TOGGLE_PAUSE" });
    const over = withState({ isGameOver: true, isPaused: false });
    const unchanged = gameReducer(over, { type: "TOGGLE_PAUSE" });

    expect(paused.isPaused).toBe(true);
    expect(unchanged.isPaused).toBe(false);
  });

  it("keeps state on hard drop when paused or game over", () => {
    const paused = withState({ isPaused: true });
    const over = withState({ isGameOver: true });

    expect(gameReducer(paused, { type: "HARD_DROP" })).toEqual(paused);
    expect(gameReducer(over, { type: "HARD_DROP" })).toEqual(over);
  });

  it("updates settings and restarts state", () => {
    const state = createInitialState(8);
    const updated = gameReducer(state, {
      type: "UPDATE_SETTINGS",
      payload: { tickMs: 222, colorMode: "mono", mainColor: "#ff00ff" },
    });
    const restarted = gameReducer(updated, { type: "RESTART", seed: 1 });

    expect(updated.settings.tickMs).toBe(222);
    expect(updated.settings.colorMode).toBe("mono");
    expect(restarted.score).toBe(0);
    expect(restarted.lines).toBe(0);
    expect(restarted.settings.tickMs).toBe(300);
  });

  it("restarts using state seed when no seed provided in action", () => {
    const state = createInitialState(42);
    const restarted = gameReducer(state, { type: "RESTART" });
    const same = createInitialState(state.seed);
    expect(restarted.score).toBe(0);
    expect(restarted.seed).toBe(same.seed);
  });

  it("handles update settings without payload", () => {
    const state = createInitialState(11);
    const updated = gameReducer(state, { type: "UPDATE_SETTINGS" });
    expect(updated.settings).toEqual(state.settings);
  });

  it("returns unchanged state for unknown action", () => {
    const state = createInitialState(8);
    const unchanged = gameReducer(state, { type: "WHATEVER" });
    expect(unchanged).toBe(state);
  });
});

describe("board projection", () => {
  it("projects active piece only in visible rows", () => {
    const state = withState({
      active: { type: "O", rotation: 0, x: 1, y: BOARD_HIDDEN_ROWS - 1 },
    });
    const projected = projectBoardWithActivePiece(state);

    expect(projected[BOARD_HIDDEN_ROWS - 1].some((cell) => cell !== null)).toBe(
      false,
    );
    expect(projected[BOARD_HIDDEN_ROWS].some((cell) => cell !== null)).toBe(
      true,
    );
  });

  it("returns board unchanged in game over", () => {
    const board = createBoard();
    board[7][5] = "T";
    const state = withState({ board, isGameOver: true });
    const projected = projectBoardWithActivePiece(state);
    expect(projected).toEqual(board);
  });
});
