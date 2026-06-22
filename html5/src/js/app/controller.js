import { PIECE_COLORS } from "../core/constants.js";
import { cellsForPiece } from "../core/tetrominoes.js";
import { createGestureRecognizer } from "./gesture-recognizer.js";

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const withMainColor = (state, pieceType) =>
  state.settings.colorMode === "mono"
    ? state.settings.mainColor
    : PIECE_COLORS[pieceType];

const resolveCellColor = (state, value) => {
  if (value === null) {
    return "var(--cell)";
  }
  return withMainColor(state, value);
};

export const createBoardView = (boardNode, rows, cols) => {
  boardNode.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  const cells = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.role = "gridcell";
      boardNode.append(cell);
      cells.push(cell);
    }
  }
  return {
    paint(state, fullBoard) {
      const rowOffset = state.view.hiddenRows;
      let index = 0;
      for (let row = rowOffset; row < rowOffset + rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const value = fullBoard[row][col];
          const node = cells[index];
          node.style.backgroundColor = resolveCellColor(state, value);
          node.classList.toggle("active", value !== null);
          index += 1;
        }
      }
    },
  };
};

const queueGridNode = () => {
  const mini = document.createElement("div");
  mini.className = "queue-mini";
  for (let index = 0; index < 16; index += 1) {
    const cell = document.createElement("div");
    cell.className = "queue-mini-cell";
    mini.append(cell);
  }
  return mini;
};

export const renderQueue = (queueNode, state) => {
  queueNode.innerHTML = "";
  for (const type of state.queue) {
    const item = document.createElement("div");
    item.className = "queue-item";
    const mini = queueGridNode();

    for (const { x, y } of cellsForPiece({ type, rotation: 0, x: 0, y: 0 })) {
      const index = y * 4 + x;
      if (index >= 0 && index < 16) {
        mini.children[index].style.backgroundColor = withMainColor(state, type);
      }
    }

    item.append(mini);
    queueNode.append(item);
  }
};

export const renderHUD = (scoreNode, pauseButton, state) => {
  const status = state.isGameOver
    ? "Game Over"
    : state.isPaused
      ? "Paused"
      : "Running";
  scoreNode.textContent = `Score: ${state.score} | Lines: ${state.lines} | ${status}`;
  pauseButton.classList.toggle("is-paused", state.isPaused);
  pauseButton.textContent = state.isPaused ? "Resume" : "Pause";
};

export const createActionBinding = (
  element,
  eventName,
  actionFactory,
  dispatch,
) => {
  const listener = (event) => {
    event.preventDefault();
    dispatch(actionFactory(event));
  };
  element.addEventListener(eventName, listener);
  return () => element.removeEventListener(eventName, listener);
};

export const createKeyboardMap = (dispatch) => {
  const actions = {
    ArrowLeft: { type: "MOVE_LEFT" },
    ArrowRight: { type: "MOVE_RIGHT" },
    ArrowDown: { type: "TICK" },
    KeyZ: { type: "ROTATE_LEFT" },
    KeyY: { type: "ROTATE_LEFT" },
    KeyX: { type: "ROTATE_RIGHT" },
    Space: { type: "HARD_DROP" },
    KeyP: { type: "TOGGLE_PAUSE" },
  };

  const listener = (event) => {
    const action = actions[event.code];
    if (!action) {
      return;
    }
    event.preventDefault();
    dispatch(action);
  };

  window.addEventListener("keydown", listener);
  return () => window.removeEventListener("keydown", listener);
};

export { createGestureRecognizer };

export const startTicker = async (store, signal) => {
  while (!signal.aborted) {
    const { tickMs } = store.getState().settings;
    await wait(tickMs);
    if (signal.aborted) {
      break;
    }
    store.dispatch({ type: "TICK" });
  }
};
