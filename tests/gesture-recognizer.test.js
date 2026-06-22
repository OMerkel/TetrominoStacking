import { beforeEach, describe, expect, it, vi } from "vitest";
import { GestureRecognizer } from "../html5/src/js/app/gesture-recognizer.js";

/**
 * Gesture Recognizer Core Tests
 *
 * Focus on state machine and callback functionality.
 * Integration tests validate gesture recognition in real usage scenarios.
 */

describe("GestureRecognizer - Core Functionality", () => {
  let recognizer;
  let onGesture;
  let onFeedback;

  beforeEach(() => {
    onGesture = vi.fn();
    onFeedback = vi.fn();
    recognizer = new GestureRecognizer({
      preset: "standard",
      onGesture,
      onFeedback,
    });
  });

  describe("Initialization", () => {
    it("should initialize in IDLE state", () => {
      expect(recognizer.getState()).toBe("IDLE");
    });

    it("should have standard thresholds by default", () => {
      const thresholds = recognizer.getThresholds();
      expect(thresholds.TAP_MAX_DISTANCE).toBe(15);
      expect(thresholds.SWIPE_MIN_DISTANCE).toBe(40);
    });
  });

  describe("Basic Tap Recognition", () => {
    it("should emit ROTATE_RIGHT on single tap", () => {
      recognizer.onPointerDown({ pointerId: 1, clientX: 100, clientY: 100 });
      recognizer.onPointerUp({ pointerId: 1 });

      expect(onGesture).toHaveBeenCalled();
      const calls = onGesture.mock.calls;
      expect(calls[calls.length - 1][0].type).toBe("ROTATE_RIGHT");
    });

    it("should not emit action if finger moves too far before release", () => {
      recognizer.onPointerDown({ pointerId: 1, clientX: 100, clientY: 100 });
      recognizer.onPointerMove({ pointerId: 1, clientX: 125, clientY: 100 });
      recognizer.onPointerUp({ pointerId: 1 });

      expect(onGesture).not.toHaveBeenCalledWith({ type: "ROTATE_RIGHT" });
    });
  });

  describe("Double Tap Recognition", () => {
    it("should emit ROTATE_LEFT on second tap after first", () => {
      // First tap
      recognizer.onPointerDown({ pointerId: 1, clientX: 100, clientY: 100 });
      recognizer.onPointerUp({ pointerId: 1 });

      // Second tap
      recognizer.onPointerDown({ pointerId: 2, clientX: 100, clientY: 100 });
      recognizer.onPointerUp({ pointerId: 2 });

      const hasTwoTapResult = onGesture.mock.calls.some(
        (call) => call[0]?.type === "ROTATE_LEFT",
      );
      expect(hasTwoTapResult).toBe(true);
    });
  });

  describe("Multi-Touch Pause", () => {
    it("should transition to MULTI_TOUCH state with two pointers", () => {
      recognizer.onPointerDown({ pointerId: 1, clientX: 100, clientY: 100 });
      expect(recognizer.getState()).toBe("TAP_TRACKING");

      recognizer.onPointerDown({ pointerId: 2, clientX: 150, clientY: 100 });
      expect(recognizer.getState()).toBe("MULTI_TOUCH");
    });

    it("should emit TOGGLE_PAUSE on two-finger tap release", () => {
      recognizer.onPointerDown({ pointerId: 1, clientX: 100, clientY: 100 });
      recognizer.onPointerDown({ pointerId: 2, clientX: 150, clientY: 100 });
      recognizer.onPointerUp({ pointerId: 1 });
      recognizer.onPointerUp({ pointerId: 2 });

      const hasPauseResult = onGesture.mock.calls.some(
        (call) => call[0]?.type === "TOGGLE_PAUSE",
      );
      expect(hasPauseResult).toBe(true);
    });
  });

  describe("State Machine Transitions", () => {
    it("should transition to TAP_TRACKING on single pointer down", () => {
      recognizer.onPointerDown({ pointerId: 1, clientX: 100, clientY: 100 });
      expect(recognizer.getState()).toBe("TAP_TRACKING");
    });

    it("should transition to CANCELLED when tap moves too far", () => {
      recognizer.onPointerDown({ pointerId: 1, clientX: 100, clientY: 100 });
      recognizer.onPointerMove({ pointerId: 1, clientX: 125, clientY: 100 });
      expect(recognizer.getState()).toBe("CANCELLED");
    });

    it("should return to IDLE after pointer release", () => {
      recognizer.onPointerDown({ pointerId: 1, clientX: 100, clientY: 100 });
      recognizer.onPointerUp({ pointerId: 1 });
      expect(recognizer.getState()).toBe("IDLE");
    });
  });

  describe("Sensitivity Presets", () => {
    it("should apply casual preset with adjusted thresholds", () => {
      recognizer.setPreset("casual");
      const thresholds = recognizer.getThresholds();

      expect(thresholds.TAP_MAX_DISTANCE).toBe(20);
      expect(thresholds.SWIPE_MIN_DISTANCE).toBe(50);
      expect(thresholds.HARD_DROP_MIN_VELOCITY).toBe(250);
    });

    it("should apply competitive preset with tighter thresholds", () => {
      recognizer.setPreset("competitive");
      const thresholds = recognizer.getThresholds();

      expect(thresholds.TAP_MAX_DISTANCE).toBe(10);
      expect(thresholds.SWIPE_MIN_DISTANCE).toBe(30);
      expect(thresholds.HARD_DROP_MIN_VELOCITY).toBe(180);
    });

    it("should revert to standard after setting preset", () => {
      recognizer.setPreset("casual");
      recognizer.setPreset("standard");
      const thresholds = recognizer.getThresholds();

      expect(thresholds.TAP_MAX_DISTANCE).toBe(15);
      expect(thresholds.SWIPE_MIN_DISTANCE).toBe(40);
    });
  });

  describe("Feedback Callbacks", () => {
    it("should invoke onFeedback callback on tap", () => {
      recognizer.onPointerDown({ pointerId: 1, clientX: 100, clientY: 100 });
      recognizer.onPointerUp({ pointerId: 1 });

      expect(onFeedback).toHaveBeenCalled();
    });

    it("should provide feedback context with type and intensity", () => {
      recognizer.onPointerDown({ pointerId: 1, clientX: 100, clientY: 100 });
      recognizer.onPointerDown({ pointerId: 2, clientX: 150, clientY: 100 });
      recognizer.onPointerUp({ pointerId: 1 });
      recognizer.onPointerUp({ pointerId: 2 });

      const pauseFeedback = onFeedback.mock.calls.some(
        (call) => call[0] === "pause" && call[1] === "medium",
      );
      expect(pauseFeedback).toBe(true);
    });
  });

  describe("Pointer Cleanup", () => {
    it("should maintain state with multiple active pointers", () => {
      recognizer.onPointerDown({ pointerId: 1, clientX: 100, clientY: 100 });
      recognizer.onPointerDown({ pointerId: 2, clientX: 150, clientY: 100 });

      recognizer.onPointerUp({ pointerId: 1 });
      expect(recognizer.getState()).toBe("MULTI_TOUCH");

      recognizer.onPointerUp({ pointerId: 2 });
      expect(recognizer.getState()).toBe("IDLE");
    });

    it("should reset pointer tracking on complete gesture", () => {
      recognizer.onPointerDown({ pointerId: 1, clientX: 100, clientY: 100 });
      recognizer.onPointerUp({ pointerId: 1 });

      recognizer.onPointerDown({ pointerId: 2, clientX: 100, clientY: 100 });
      expect(recognizer.getState()).toBe("TAP_TRACKING");
    });
  });
});
