export const createStore = (reducer, initialState) => {
  let state = initialState;
  const listeners = new Set();

  const getState = () => state;

  const dispatch = (action) => {
    const nextState = reducer(state, action);
    if (nextState === state) {
      return state;
    }
    state = nextState;
    for (const listener of listeners) {
      listener(state, action);
    }
    return state;
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    getState,
    dispatch,
    subscribe,
  };
};
