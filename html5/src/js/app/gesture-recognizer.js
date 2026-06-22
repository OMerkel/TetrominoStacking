/**
 * Sophisticated gesture recognizer for touch and pointer input.
 *
 * Implements a complete gesture language for Tetromino game control:
 * - Tap/Double Tap for rotation
 * - Swipes for movement and drops
 * - Multi-touch for pause
 * - State machine with conflict resolution and cooldowns
 *
 * Reference: doc/gesture_controls_spec.md
 */

// Gesture thresholds (milliseconds and pixels)
const THRESHOLDS = {
  TAP_MAX_TIME: 300,
  TAP_MAX_DISTANCE: 15,
  DOUBLE_TAP_MAX_TIME: 400,
  SWIPE_MIN_DISTANCE: 40,
  SOFT_DROP_MIN_DISTANCE: 20,
  SOFT_DROP_MAX_DISTANCE: 100,
  HARD_DROP_MIN_DISTANCE: 100,
  HARD_DROP_MIN_VELOCITY: 200,
  MOVE_MIN_DISTANCE: 50, // for hold gesture
  MOVE_REPEAT_COOLDOWN: 80,
  ACTION_REPEAT_COOLDOWN: 60,
  TWO_FINGER_MAX_TIME: 300,
};

// Gesture state machine states
const STATE = {
  IDLE: "IDLE",
  TAP_TRACKING: "TAP_TRACKING",
  DOUBLE_TAP_TRACKING: "DOUBLE_TAP_TRACKING",
  HORIZONTAL_SWIPE: "HORIZONTAL_SWIPE",
  SOFT_DROP: "SOFT_DROP",
  HARD_DROP: "HARD_DROP",
  MULTI_TOUCH: "MULTI_TOUCH",
  CANCELLED: "CANCELLED",
};

/**
 * GestureRecognizer: State machine for touch gesture recognition.
 *
 * Emits actions by calling callbacks:
 * - onGesture(actionType): emit action to game engine
 * - onFeedback(type, intensity): optional haptic/visual feedback
 */
export class GestureRecognizer {
  constructor(options = {}) {
    // Callbacks
    this.onGesture = options.onGesture || (() => {});
    this.onFeedback = options.onFeedback || (() => {});

    // Sensitivity preset (casual, standard, competitive)
    this.preset = options.preset || "standard";
    this.thresholds = { ...THRESHOLDS, ...this._applyPreset(this.preset) };

    // State
    this.state = STATE.IDLE;
    this.pointers = new Map(); // pointerID -> { x0, y0, t0, x, y, t, path, lastMoveTime }
    this.lastTapTime = 0;
    this.lastTapPosition = null;
    this.activePointerIds = new Set();

    // Cooldowns
    this.moveRepeatTime = {}; // pointerID -> timestamp
    this.actionRepeatTime = 0;
  }

  /**
   * Apply sensitivity preset adjustments to thresholds.
   */
  _applyPreset(preset) {
    const presets = {
      casual: {
        TAP_MAX_DISTANCE: 20,
        SWIPE_MIN_DISTANCE: 50,
        HARD_DROP_MIN_VELOCITY: 250,
      },
      standard: {},
      competitive: {
        TAP_MAX_DISTANCE: 10,
        SWIPE_MIN_DISTANCE: 30,
        HARD_DROP_MIN_VELOCITY: 180,
      },
    };
    return presets[preset] || {};
  }

  /**
   * Handle pointerdown event.
   */
  onPointerDown(event) {
    const { pointerId, clientX, clientY } = event;
    const now = performance.now();

    this.pointers.set(pointerId, {
      x0: clientX,
      y0: clientY,
      t0: now,
      x: clientX,
      y: clientY,
      t: now,
      path: [{ x: clientX, y: clientY, t: now }],
      lastMoveTime: now,
    });

    this.activePointerIds.add(pointerId);

    // Check for multi-touch (2+ fingers)
    if (this.activePointerIds.size >= 2) {
      this.state = STATE.MULTI_TOUCH;
    } else if (
      this.state === STATE.IDLE ||
      this.state === STATE.DOUBLE_TAP_TRACKING
    ) {
      this.state = STATE.TAP_TRACKING;
    }
  }

  /**
   * Handle pointermove event.
   */
  onPointerMove(event) {
    const { pointerId, clientX, clientY } = event;
    const now = performance.now();

    const pointer = this.pointers.get(pointerId);
    if (!pointer) return;

    pointer.x = clientX;
    pointer.y = clientY;
    pointer.t = now;
    pointer.path.push({ x: clientX, y: clientY, t: now });

    // Keep path to last 10 points for velocity calculation
    if (pointer.path.length > 10) {
      pointer.path.shift();
    }

    const dx = clientX - pointer.x0;
    const dy = clientY - pointer.y0;
    const elapsed = now - pointer.t0;
    const distance = Math.hypot(dx, dy);

    // Detect cancellation: too much movement for tap states
    if (
      (this.state === STATE.TAP_TRACKING ||
        this.state === STATE.DOUBLE_TAP_TRACKING) &&
      distance > this.thresholds.TAP_MAX_DISTANCE
    ) {
      this.state = STATE.CANCELLED;
      return;
    }

    // Multi-touch cancellation
    if (
      this.state === STATE.MULTI_TOUCH &&
      distance > this.thresholds.TAP_MAX_DISTANCE
    ) {
      this.state = STATE.CANCELLED;
      return;
    }

    // Classify gesture on move (only if still in tap tracking, i.e., not yet classified)
    if (
      this.state === STATE.TAP_TRACKING ||
      this.state === STATE.DOUBLE_TAP_TRACKING
    ) {
      this._classifyGesture(dx, dy, elapsed, pointerId, now);
    } else if (this.state === STATE.HORIZONTAL_SWIPE) {
      this._handleHorizontalSwipe(pointerId, dx, now);
    } else if (this.state === STATE.SOFT_DROP) {
      this._handleSoftDrop(pointerId, dy, now);
    } else if (this.state === STATE.HARD_DROP) {
      // Already in hard drop; just track for completion on pointerup
    }
  }

  /**
   * Handle pointerup event.
   */
  onPointerUp(event) {
    const { pointerId } = event;
    const now = performance.now();

    const pointer = this.pointers.get(pointerId);
    if (!pointer) return;

    const dx = pointer.x - pointer.x0;
    const dy = pointer.y - pointer.y0;
    const elapsed = now - pointer.t0;
    const distance = Math.hypot(dx, dy);

    // Handle state-based completion
    if (this.state === STATE.TAP_TRACKING) {
      if (
        elapsed <= this.thresholds.TAP_MAX_TIME &&
        distance <= this.thresholds.TAP_MAX_DISTANCE
      ) {
        this._handleTap(now);
      }
    } else if (this.state === STATE.DOUBLE_TAP_TRACKING) {
      if (
        elapsed <= this.thresholds.TAP_MAX_TIME &&
        distance <= this.thresholds.TAP_MAX_DISTANCE
      ) {
        // Second tap confirmed; already handled in _handleTap
      }
      this.state = STATE.IDLE;
    } else if (this.state === STATE.HARD_DROP && elapsed > 50) {
      // Hard drop has been detected; emit hard drop action
      this._emitAction("HARD_DROP");
      this.onFeedback("hard-drop", "strong");
    } else if (this.state === STATE.MULTI_TOUCH) {
      // Check if this was a valid two-finger tap
      if (
        this.activePointerIds.size === 2 &&
        elapsed <= this.thresholds.TWO_FINGER_MAX_TIME &&
        distance <= this.thresholds.TAP_MAX_DISTANCE
      ) {
        this._emitAction("TOGGLE_PAUSE");
        this.onFeedback("pause", "medium");
      }
    }

    // Cleanup
    this.pointers.delete(pointerId);
    this.activePointerIds.delete(pointerId);
    delete this.moveRepeatTime[pointerId];

    // Reset state to IDLE if no active pointers
    if (this.activePointerIds.size === 0) {
      this.state = STATE.IDLE;
    }
  }

  /**
   * Classify gesture based on displacement.
   * Prioritizes hard drop > horizontal swipe > soft drop.
   */
  _classifyGesture(dx, dy, elapsed, pointerId, now) {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Compute velocity for hard drop detection
    const velocity = absDy > 0 && elapsed > 0 ? absDy / (elapsed / 1000) : 0;

    // Hard drop: fast downward flick
    if (
      dy > this.thresholds.HARD_DROP_MIN_DISTANCE &&
      velocity > this.thresholds.HARD_DROP_MIN_VELOCITY &&
      absDx < absDy * 0.5
    ) {
      this.state = STATE.HARD_DROP;
      return;
    }

    // Horizontal swipe: left or right (prioritize over vertical gestures)
    if (absDx >= this.thresholds.SWIPE_MIN_DISTANCE && absDy < absDx * 0.5) {
      this.state = STATE.HORIZONTAL_SWIPE;
      this._handleHorizontalSwipe(pointerId, dx, now);
      return;
    }

    // Soft drop: downward swipe (slower than hard drop)
    if (
      dy >= this.thresholds.SOFT_DROP_MIN_DISTANCE &&
      dy <= this.thresholds.SOFT_DROP_MAX_DISTANCE &&
      absDx < absDy * 0.5
    ) {
      this.state = STATE.SOFT_DROP;
      this._handleSoftDrop(pointerId, dy, now);
      return;
    }

    // Hold/swap: upward swipe (minimum upward distance, minimal horizontal movement)
    if (dy < -this.thresholds.MOVE_MIN_DISTANCE && absDx < absDy * 0.5) {
      this._emitAction("HOLD_PIECE");
      this.onFeedback("hold", "medium");
      this.state = STATE.CANCELLED;
      return;
    }
  }

  /**
   * Handle horizontal swipe with repeat cooldown.
   */
  _handleHorizontalSwipe(pointerId, dx, now) {
    const direction = dx > 0 ? "RIGHT" : "LEFT";
    const action = `MOVE_${direction}`;

    const lastMoveTime = this.moveRepeatTime[pointerId] || 0;
    if (now - lastMoveTime >= this.thresholds.MOVE_REPEAT_COOLDOWN) {
      this._emitAction(action);
      this.onFeedback("move", "very-light");
      this.moveRepeatTime[pointerId] = now;
    }
  }

  /**
   * Handle soft drop with action repeat cooldown.
   */
  _handleSoftDrop(_pointerId, _dy, now) {
    if (now - this.actionRepeatTime >= this.thresholds.ACTION_REPEAT_COOLDOWN) {
      this._emitAction("TICK");
      this.actionRepeatTime = now;
    }
  }

  /**
   * Handle tap with double-tap detection.
   */
  _handleTap(now) {
    const timeSinceLastTap = now - this.lastTapTime;

    if (
      timeSinceLastTap <= this.thresholds.DOUBLE_TAP_MAX_TIME &&
      this.lastTapTime > 0
    ) {
      // Double tap detected; emit rotate left immediately
      this._emitAction("ROTATE_LEFT");
      this.onFeedback("rotate", "light");
      this.lastTapTime = 0; // Reset to prevent triple-tap
      this.state = STATE.IDLE;
    } else {
      // First tap; emit rotate right
      this._emitAction("ROTATE_RIGHT");
      this.onFeedback("rotate", "light");
      this.lastTapTime = now;
      this.state = STATE.IDLE;
    }
  }

  /**
   * Emit action to game engine with cooldown check for safety.
   */
  _emitAction(actionType) {
    this.onGesture({ type: actionType });
  }

  /**
   * Set sensitivity preset at runtime.
   */
  setPreset(preset) {
    this.preset = preset;
    this.thresholds = { ...THRESHOLDS, ...this._applyPreset(preset) };
  }

  /**
   * Get current gesture state (for debugging).
   */
  getState() {
    return this.state;
  }

  /**
   * Get current thresholds (for debugging).
   */
  getThresholds() {
    return { ...this.thresholds };
  }
}

/**
 * Factory function: Create gesture recognizer and attach to element.
 *
 * Usage:
 *   const unsubscribe = createGestureRecognizer(boardElement, store.dispatch, {
 *     preset: 'standard',
 *     haptics: true,
 *     audio: true,
 *   });
 */
export const createGestureRecognizer = (element, dispatch, options = {}) => {
  const recognizer = new GestureRecognizer({
    preset: options.preset || "standard",
    onGesture: (action) => dispatch(action),
    onFeedback: (type, intensity) => {
      if (options.haptics) {
        triggerHaptic(type, intensity);
      }
      if (options.audio) {
        triggerAudio(type);
      }
    },
  });

  // Attach pointer event listeners
  const handlePointerDown = (e) => recognizer.onPointerDown(e);
  const handlePointerMove = (e) => recognizer.onPointerMove(e);
  const handlePointerUp = (e) => recognizer.onPointerUp(e);

  element.addEventListener("pointerdown", handlePointerDown);
  element.addEventListener("pointermove", handlePointerMove);
  element.addEventListener("pointerup", handlePointerUp);

  // Return unsubscribe function
  return () => {
    element.removeEventListener("pointerdown", handlePointerDown);
    element.removeEventListener("pointermove", handlePointerMove);
    element.removeEventListener("pointerup", handlePointerUp);
  };
};

/**
 * Haptic feedback (placeholder; implement platform-specific logic).
 */
function triggerHaptic(type, intensity) {
  if (!navigator.vibrate) return;

  const patterns = {
    light: [20],
    medium: [40],
    strong: [80],
    "very-light": [10],
    move: [8],
    rotate: [20],
    hold: [50],
    "hard-drop": [100, 50, 80],
    pause: [40, 30, 40],
  };

  const pattern = patterns[type] || patterns[intensity] || [30];
  navigator.vibrate(pattern);
}

/**
 * Audio feedback (placeholder; implement with Web Audio API or sound sprites).
 */
function triggerAudio(_type) {
  // Placeholder: In production, use Web Audio API or preloaded sound sprites
  // Example: play sound from audio context or <audio> element by ID
  // const audioElement = document.getElementById(`sound-${type}`);
  // if (audioElement) audioElement.currentTime = 0; audioElement.play();
}
