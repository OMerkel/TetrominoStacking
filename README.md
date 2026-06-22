# Tetromino Stacking

![Tetromino Stacking icon](html5/src/img/icons/tetromino64.png)

- Start a browser session at: [Tetromino Stacking](https://omerkel.github.io/TetrominoStacking/html5/src/index.html)

## Abstract

Try to best pack falling [tetromino](https://en.wikipedia.org/wiki/Tetromino) shapes on a grid in this game.
Completed horizontal lines are removed and remaining shapes above will fall down.

## Keywords, Categories

Action game, Solitaire, Single Player, Games/Entertainment, Mobile, JavaScript, ECMAScript

## Rules

Try to best pack falling tetromino shapes on a grid in this game.
The player can move the falling shape horizontally or turn it clockwise or anti-clockwise.
Completed horizontal lines are removed and remaining shapes above will fall down automatically then.
Game play continues until it is impossible to place a remaining tetromino shape.

## Controls

### Keyboard Controls

- **Arrow Left / Right**: Move piece left or right
- **Arrow Down**: Soft drop (speed up falling)
- **Z / Y**: Rotate counter-clockwise
- **X**: Rotate clockwise
- **Space**: Hard drop (instant lock)
- **P**: Pause/Resume

### Touch Gesture Controls (Mobile/Tablet Optimized)

Tetromino Stacking supports intuitive screen gestures for touch devices, designed for one-handed play and continuous eye contact with the board.

#### Gesture Reference

| Gesture | Action | Details |
| ------- | ------ | ------- |
| **Tap** | Rotate clockwise | Single quick tap on the board |
| **Double Tap** | Rotate counter-clockwise | Two taps within 400ms |
| **Swipe Left** | Move left | Horizontal swipe to the left (minimum 40px) |
| **Swipe Right** | Move right | Horizontal swipe to the right (minimum 40px) |
| **Swipe Down** | Soft drop | Downward swipe while finger is active (continuous drop) |
| **Flick Down** | Hard drop | Fast downward flick (>200 px/s velocity) |
| **Swipe Up** | Hold/Swap piece | Upward swipe to hold or swap with reserve piece |
| **Two-Finger Tap** | Pause/Resume | Tap with two fingers simultaneously |

#### Gesture Recognition Details

- **Sensitivity**: Adjustable via three presets:
  - **Casual**: Forgiving thresholds, suitable for relaxed play
  - **Standard**: Balanced defaults (recommended)
  - **Competitive**: Tight thresholds for fast-paced play
- **Feedback**: Optional haptic vibration and audio cues for gesture recognition (configurable)
- **Conflict Resolution**: Gestures are prioritized intelligently:
  - Fast flicks take precedence over slow swipes
  - Horizontal swipes win over tap-like movements
  - Two-finger taps are isolated to prevent accidental single-finger interpretation
- **Repeat Behavior**:
  - Horizontal swipes repeat every 80ms while sliding continues
  - Soft drops repeat every 60ms while finger stays down
  - Hard drops trigger once on flick detection

#### On-Screen Buttons

On-screen control buttons are always available as a fallback:

- **Left / Right / Soft Drop buttons** for direct piece control
- **Rotate Left / Right buttons** for rotation
- **Pause button** to pause/resume the game

Buttons remain functional even when using gestures and can be disabled via accessibility settings if desired.

#### Tips for Touch Play

1. **Keep gestures within the board area** for best recognition.
2. **Use small, deliberate movements** to avoid accidental triggers.
3. **Double taps are forgiving** — up to 400ms between taps counts as a double.
4. **Soft drops are continuous** — hold your finger down to keep dropping.
5. **Hard drops are velocity-based** — make quick flicking motions downward.
6. **Experiment with presets** in settings to find what feels most comfortable.

### Keyboard Shortcuts (Advanced)

- Hold **Arrow Left/Right** for continuous movement
- Press **Arrow Down** repeatedly for soft drop control
- Combine **P** with other keys to toggle pause during play

## Runtime Dependencies

This project now runs with framework-free modern JavaScript and has no browser runtime dependencies.

## Development Commands

- `npm test` - Runs the standard Vitest suite with coverage thresholds.
- `npm run test:guard` - Runs Vitest with verbose reporter and coverage as a migration/compatibility guard.
- `npm run verify:ci` - Runs both standard and guard test passes for CI hardening.

## Links

- An essay on [Intellectual Property and Usage of Related Terminology in Tetrominoes](https://desiree47.wordpress.com)
- [Tetrominoes on Wikipedia](https://en.wikipedia.org/wiki/Tetromino)

## Contributors / Authors

- Oliver Merkel
- License note for author photo: [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International](http://creativecommons.org/licenses/by-nc-nd/4.0/)
- Author photo: ![Oliver Merkel](html5/src/img/oliver1912.jpg)

_All logos, brands and trademarks mentioned belong to their respective owners._
