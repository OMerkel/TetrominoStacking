import { describe, expect, it, vi } from "vitest";
import { createStore } from "../html5/src/js/app/store.js";

describe("store", () => {
  it("dispatches and notifies subscribers", () => {
    const reducer = (state, action) => ({
      ...state,
      value: state.value + action.delta,
    });
    const store = createStore(reducer, { value: 0 });
    const listener = vi.fn();

    store.subscribe(listener);
    store.dispatch({ delta: 2 });

    expect(store.getState().value).toBe(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("can unsubscribe listeners", () => {
    const reducer = (state, action) => (action.type === "NOOP" ? state : state);
    const store = createStore(reducer, { value: 0 });
    const listener = vi.fn();

    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.dispatch({ type: "NOOP" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("does not notify when reducer returns same object", () => {
    const state = { value: 4 };
    const reducer = () => state;
    const store = createStore(reducer, state);
    const listener = vi.fn();

    store.subscribe(listener);
    store.dispatch({ type: "ANY" });

    expect(listener).not.toHaveBeenCalled();
    expect(store.getState()).toBe(state);
  });
});
