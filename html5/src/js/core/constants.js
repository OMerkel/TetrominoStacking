export const BOARD_COLS = 10;
export const BOARD_VISIBLE_ROWS = 20;
export const BOARD_HIDDEN_ROWS = 4;
export const BOARD_ROWS = BOARD_VISIBLE_ROWS + BOARD_HIDDEN_ROWS;
export const INITIAL_TICK_MS = 300;
export const INITIAL_QUEUE_SIZE = 3;

export const PIECE_TYPES = Object.freeze(["I", "O", "T", "S", "Z", "J", "L"]);

export const PIECE_COLORS = Object.freeze({
  I: "#36c9ff",
  O: "#f6d743",
  T: "#8e66ff",
  S: "#57d27e",
  Z: "#ff6a67",
  J: "#4a78ff",
  L: "#ff9f3e",
});

export const CELL_EMPTY = null;
