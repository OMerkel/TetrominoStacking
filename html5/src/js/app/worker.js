import { createInitialState, gameReducer } from "../core/engine.js";
import { createStore } from "./store.js";

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const store = createStore(gameReducer, createInitialState(Date.now() >>> 0));

// Notify the main thread of every state change and include the action that
// produced the new state. The main thread uses this to build a replay log.
store.subscribe((state, action) => {
  self.postMessage({ type: "STATE", state, action });
});

// Send the initial state immediately so the main thread can render before the
// first tick fires.
self.postMessage({ type: "STATE", state: store.getState() });

// Forward actions that originate on the main thread (player input, settings,
// restart, etc.) into the store.
self.onmessage = ({ data }) => {
  if (data.type === "ACTION") {
    store.dispatch(data.action);
  }
};

// Async gravity ticker – runs for the lifetime of the worker.  The reducer
// already ignores TICK when the game is paused or over, so no extra guard is
// needed here.
const runTicker = async () => {
  while (true) {
    const { tickMs } = store.getState().settings;
    await wait(tickMs);
    store.dispatch({ type: "TICK" });
  }
};

runTicker();
