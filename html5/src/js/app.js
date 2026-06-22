import {
  createActionBinding,
  createBoardView,
  createGestureRecognizer,
  createKeyboardMap,
  renderHUD,
  renderQueue,
} from "./app/controller.js";
import {
  clearHighScores,
  getHighScoresForDelay,
  recordHighScore,
} from "./app/leaderboard.js";
import {
  applyStateToOptionsForm,
  bindNavigationAndSubpages,
} from "./app/navigation.js";
import { registerServiceWorker } from "./app/service-worker-client.js";
import { projectBoardWithActivePiece } from "./core/engine.js";

// Register service worker for offline support (non-blocking)
registerServiceWorker();

const byId = (id) => document.getElementById(id);
const REPLAY_STORAGE_KEY = "tetromino.replay.v1";
const MAX_REPLAY_ACTIONS = 10000;

const nodes = {
  board: byId("board"),
  queue: byId("queue"),
  score: byId("score-label"),
  delay: byId("delay"),
  delayOutput: byId("delay-output"),
  mainColor: byId("maincolor"),
  mono: byId("monocolor"),
  multi: byId("multicolor"),
  pause: byId("pause-toggle"),
  leaderboardLabel: byId("leaderboard-label"),
  leaderboardList: byId("leaderboard-list"),
  leaderboardReset: byId("leaderboard-reset"),
  mainNav: byId("main-nav"),
  menuToggle: byId("menu-toggle"),
  optionsPage: byId("options-page"),
  rulesPage: byId("rules-page"),
  aboutPage: byId("about-page"),
};

const bindGameActions = (store) => {
  const unsubs = [];
  const bind = (id, action) => {
    const node = byId(id);
    unsubs.push(
      createActionBinding(node, "click", () => action, store.dispatch),
    );
  };

  bind("move-left", { type: "MOVE_LEFT" });
  bind("move-right", { type: "MOVE_RIGHT" });
  bind("rotate-left", { type: "ROTATE_LEFT" });
  bind("rotate-right", { type: "ROTATE_RIGHT" });
  bind("soft-drop", { type: "TICK" });
  bind("pause-toggle", { type: "TOGGLE_PAUSE" });
  bind("restart", { type: "RESTART" });

  unsubs.push(createKeyboardMap(store.dispatch));
  unsubs.push(
    createGestureRecognizer(nodes.board, store.dispatch, {
      preset: "standard",
    }),
  );
  return () => {
    for (const unsub of unsubs) {
      unsub();
    }
  };
};

const start = () => {
  const worker = new Worker(new URL("./app/worker.js", import.meta.url), {
    type: "module",
  });

  // Proxy store: state lives in the worker; the main thread holds the last
  // received snapshot for synchronous reads (e.g. options cancel flow).
  let currentState = null;
  let actionLog = [];
  const listeners = new Set();

  const persistReplaySnapshot = () => {
    if (!currentState) {
      return;
    }
    const snapshot = {
      seed: currentState.seed,
      actionLog,
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore storage failures (private mode, quota exceeded, blocked storage).
    }
  };

  const renderLeaderboard = (state) => {
    const { rangeLabel, entries } = getHighScoresForDelay(
      localStorage,
      state.settings.tickMs,
    );
    nodes.leaderboardLabel.textContent = `High Scores (${rangeLabel})`;
    nodes.leaderboardList.innerHTML = "";

    if (entries.length === 0) {
      const item = document.createElement("li");
      item.textContent = "No scores yet";
      nodes.leaderboardList.append(item);
      return;
    }

    for (const entry of entries) {
      const item = document.createElement("li");
      item.textContent = `${entry.score} pts (${entry.lines} lines)`;
      nodes.leaderboardList.append(item);
    }
  };

  nodes.leaderboardReset.addEventListener("click", (event) => {
    event.preventDefault();
    clearHighScores(localStorage);
    if (currentState) {
      renderLeaderboard(currentState);
    }
  });

  const store = {
    getState: () => currentState,
    dispatch: (action) => worker.postMessage({ type: "ACTION", action }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  bindNavigationAndSubpages(nodes, store);
  bindGameActions(store);

  let boardView = null;

  worker.onmessage = ({ data }) => {
    if (data.type !== "STATE") return;
    const previousState = currentState;
    const { state, action } = data;
    const isFirst = currentState === null;
    currentState = state;

    if (action) {
      if (action.type === "RESTART") {
        actionLog = [];
      } else {
        actionLog = [...actionLog, action];
        if (actionLog.length > MAX_REPLAY_ACTIONS) {
          actionLog = actionLog.slice(actionLog.length - MAX_REPLAY_ACTIONS);
        }
      }
    }
    persistReplaySnapshot();

    if (previousState && !previousState.isGameOver && state.isGameOver) {
      recordHighScore(localStorage, {
        score: state.score,
        lines: state.lines,
        tickMs: state.settings.tickMs,
      });
    }

    if (isFirst) {
      boardView = createBoardView(
        nodes.board,
        state.view.rows,
        state.view.cols,
      );
      applyStateToOptionsForm(nodes, state);
    }

    const fullBoard = projectBoardWithActivePiece(state);
    boardView.paint(state, fullBoard);
    renderHUD(nodes.score, nodes.pause, state);
    renderQueue(nodes.queue, state);
    renderLeaderboard(state);

    for (const listener of listeners) {
      listener(state);
    }
  };

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      store.dispatch({ type: "TOGGLE_PAUSE" });
    }
  });
};

window.addEventListener("DOMContentLoaded", start);
