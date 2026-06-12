import {
  BOARD_COLS,
  BOARD_HIDDEN_ROWS,
  BOARD_ROWS,
  BOARD_VISIBLE_ROWS,
  CELL_EMPTY,
  INITIAL_QUEUE_SIZE,
  INITIAL_TICK_MS,
  PIECE_TYPES,
} from "./constants.js";
import { pickFromList } from "./random.js";
import { cellsForPiece } from "./tetrominoes.js";

const cloneBoard = (board) => board.map((row) => row.slice());

export const createBoard = (rows = BOARD_ROWS, cols = BOARD_COLS) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => CELL_EMPTY),
  );

const randomPieceType = (seed) => pickFromList(seed, PIECE_TYPES);

const buildQueue = (seed, size = INITIAL_QUEUE_SIZE) => {
  let currentSeed = seed;
  const queue = [];
  for (let index = 0; index < size; index += 1) {
    const next = randomPieceType(currentSeed);
    currentSeed = next.seed;
    queue.push(next.value);
  }
  return { seed: currentSeed, queue };
};

const createSpawnPiece = (type) => ({
  type,
  rotation: 0,
  x: 3,
  y: 0,
});

const inHorizontalBounds = (x) => x >= 0 && x < BOARD_COLS;
const inVerticalBounds = (y) => y < BOARD_ROWS;

const boardCellOccupied = (board, x, y) => y >= 0 && board[y][x] !== CELL_EMPTY;

export const collides = (board, piece) =>
  cellsForPiece(piece).some(
    ({ x, y }) =>
      !inHorizontalBounds(x) ||
      !inVerticalBounds(y) ||
      boardCellOccupied(board, x, y),
  );

const addPieceToBoard = (board, piece) => {
  const nextBoard = cloneBoard(board);
  for (const { x, y } of cellsForPiece(piece)) {
    if (y >= 0 && y < BOARD_ROWS && x >= 0 && x < BOARD_COLS) {
      nextBoard[y][x] = piece.type;
    }
  }
  return nextBoard;
};

export const clearCompletedLines = (board) => {
  const remainingRows = board.filter((row) =>
    row.some((cell) => cell === CELL_EMPTY),
  );
  const clearedLines = board.length - remainingRows.length;
  const fillerRows = Array.from({ length: clearedLines }, () =>
    Array.from({ length: BOARD_COLS }, () => CELL_EMPTY),
  );
  return {
    board: [...fillerRows, ...remainingRows],
    clearedLines,
  };
};

const scoreForLines = (lineCount) => {
  if (lineCount <= 0) {
    return 0;
  }
  return 100 * lineCount * lineCount;
};

const spawnNextPiece = (state) => {
  const [headType, ...restQueue] = state.queue;
  const randomResult = randomPieceType(state.seed);
  const nextQueue = [...restQueue, randomResult.value];
  const nextActive = createSpawnPiece(headType);
  const gameOver = collides(state.board, nextActive);

  return {
    ...state,
    active: nextActive,
    queue: nextQueue,
    seed: randomResult.seed,
    isGameOver: gameOver,
  };
};

const movePiece = (state, deltaX, deltaY) => {
  if (state.isPaused || state.isGameOver) {
    return state;
  }
  const moved = {
    ...state.active,
    x: state.active.x + deltaX,
    y: state.active.y + deltaY,
  };
  if (collides(state.board, moved)) {
    return state;
  }
  return {
    ...state,
    active: moved,
  };
};

const rotatePiece = (state, rotationDelta) => {
  if (state.isPaused || state.isGameOver) {
    return state;
  }

  const target = {
    ...state.active,
    rotation: (state.active.rotation + rotationDelta + 4) % 4,
  };

  const wallKickOffsets = [0, -1, 1, -2, 2];
  const candidate = wallKickOffsets
    .map((xOffset) => ({ ...target, x: target.x + xOffset }))
    .find((piece) => !collides(state.board, piece));

  return candidate ? { ...state, active: candidate } : state;
};

const lockAndProgress = (state) => {
  const lockedBoard = addPieceToBoard(state.board, state.active);
  const { board: clearedBoard, clearedLines } =
    clearCompletedLines(lockedBoard);
  const afterLock = {
    ...state,
    board: clearedBoard,
    score: state.score + scoreForLines(clearedLines),
    lines: state.lines + clearedLines,
  };
  return spawnNextPiece(afterLock);
};

const dropOneStep = (state) => {
  if (state.isPaused || state.isGameOver) {
    return state;
  }
  const attempted = {
    ...state.active,
    y: state.active.y + 1,
  };
  if (collides(state.board, attempted)) {
    return lockAndProgress(state);
  }
  return {
    ...state,
    active: attempted,
  };
};

const hardDrop = (state) => {
  if (state.isPaused || state.isGameOver) {
    return state;
  }

  let nextState = state;
  let guard = 0;
  while (true) {
    const advanced = dropOneStep(nextState);
    if (advanced.active.y <= nextState.active.y || guard >= BOARD_ROWS) {
      return advanced;
    }
    nextState = advanced;
    guard += 1;
  }
};

const updateSettings = (state, payload) => ({
  ...state,
  settings: {
    ...state.settings,
    ...payload,
  },
});

export const createInitialState = (seed = 1) => {
  const createdBoard = createBoard();
  const queueSeed = buildQueue(seed, INITIAL_QUEUE_SIZE + 1);
  const [firstType, ...restQueue] = queueSeed.queue;
  const initial = {
    board: createdBoard,
    active: createSpawnPiece(firstType),
    queue: restQueue,
    score: 0,
    lines: 0,
    isPaused: false,
    isGameOver: false,
    seed: queueSeed.seed,
    settings: {
      tickMs: INITIAL_TICK_MS,
      colorMode: "multi",
      mainColor: "#00ffff",
    },
    view: {
      cols: BOARD_COLS,
      rows: BOARD_VISIBLE_ROWS,
      hiddenRows: BOARD_HIDDEN_ROWS,
    },
  };

  return initial;
};

export const gameReducer = (state, action) => {
  switch (action.type) {
    case "TICK":
      return dropOneStep(state);
    case "MOVE_LEFT":
      return movePiece(state, -1, 0);
    case "MOVE_RIGHT":
      return movePiece(state, 1, 0);
    case "MOVE_DOWN":
      return movePiece(state, 0, 1);
    case "ROTATE_LEFT":
      return rotatePiece(state, -1);
    case "ROTATE_RIGHT":
      return rotatePiece(state, 1);
    case "HARD_DROP":
      return hardDrop(state);
    case "TOGGLE_PAUSE":
      return state.isGameOver ? state : { ...state, isPaused: !state.isPaused };
    case "UPDATE_SETTINGS":
      return updateSettings(state, action.payload ?? {});
    case "RESTART":
      return createInitialState(action.seed ?? state.seed);
    default:
      return state;
  }
};

export const projectBoardWithActivePiece = (state) => {
  const projected = cloneBoard(state.board);
  if (state.isGameOver) {
    return projected;
  }
  for (const { x, y } of cellsForPiece(state.active)) {
    if (
      y >= state.view.hiddenRows &&
      y < BOARD_ROWS &&
      x >= 0 &&
      x < BOARD_COLS
    ) {
      projected[y][x] = state.active.type;
    }
  }
  return projected;
};
