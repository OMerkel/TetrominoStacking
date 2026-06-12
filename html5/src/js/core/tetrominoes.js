const R = (x, y) => ({ x, y });

export const PIECE_ROTATIONS = Object.freeze({
  I: Object.freeze([
    Object.freeze([R(0, 1), R(1, 1), R(2, 1), R(3, 1)]),
    Object.freeze([R(2, 0), R(2, 1), R(2, 2), R(2, 3)]),
    Object.freeze([R(0, 2), R(1, 2), R(2, 2), R(3, 2)]),
    Object.freeze([R(1, 0), R(1, 1), R(1, 2), R(1, 3)]),
  ]),
  O: Object.freeze([
    Object.freeze([R(1, 0), R(2, 0), R(1, 1), R(2, 1)]),
    Object.freeze([R(1, 0), R(2, 0), R(1, 1), R(2, 1)]),
    Object.freeze([R(1, 0), R(2, 0), R(1, 1), R(2, 1)]),
    Object.freeze([R(1, 0), R(2, 0), R(1, 1), R(2, 1)]),
  ]),
  T: Object.freeze([
    Object.freeze([R(1, 0), R(0, 1), R(1, 1), R(2, 1)]),
    Object.freeze([R(1, 0), R(1, 1), R(2, 1), R(1, 2)]),
    Object.freeze([R(0, 1), R(1, 1), R(2, 1), R(1, 2)]),
    Object.freeze([R(1, 0), R(0, 1), R(1, 1), R(1, 2)]),
  ]),
  S: Object.freeze([
    Object.freeze([R(1, 0), R(2, 0), R(0, 1), R(1, 1)]),
    Object.freeze([R(1, 0), R(1, 1), R(2, 1), R(2, 2)]),
    Object.freeze([R(1, 1), R(2, 1), R(0, 2), R(1, 2)]),
    Object.freeze([R(0, 0), R(0, 1), R(1, 1), R(1, 2)]),
  ]),
  Z: Object.freeze([
    Object.freeze([R(0, 0), R(1, 0), R(1, 1), R(2, 1)]),
    Object.freeze([R(2, 0), R(1, 1), R(2, 1), R(1, 2)]),
    Object.freeze([R(0, 1), R(1, 1), R(1, 2), R(2, 2)]),
    Object.freeze([R(1, 0), R(0, 1), R(1, 1), R(0, 2)]),
  ]),
  J: Object.freeze([
    Object.freeze([R(0, 0), R(0, 1), R(1, 1), R(2, 1)]),
    Object.freeze([R(1, 0), R(2, 0), R(1, 1), R(1, 2)]),
    Object.freeze([R(0, 1), R(1, 1), R(2, 1), R(2, 2)]),
    Object.freeze([R(1, 0), R(1, 1), R(0, 2), R(1, 2)]),
  ]),
  L: Object.freeze([
    Object.freeze([R(2, 0), R(0, 1), R(1, 1), R(2, 1)]),
    Object.freeze([R(1, 0), R(1, 1), R(1, 2), R(2, 2)]),
    Object.freeze([R(0, 1), R(1, 1), R(2, 1), R(0, 2)]),
    Object.freeze([R(0, 0), R(1, 0), R(1, 1), R(1, 2)]),
  ]),
});

export const getOffsets = (type, rotation) => {
  const normalizedRotation = ((rotation % 4) + 4) % 4;
  return PIECE_ROTATIONS[type][normalizedRotation];
};

export const cellsForPiece = (piece) =>
  getOffsets(piece.type, piece.rotation).map((offset) => ({
    x: piece.x + offset.x,
    y: piece.y + offset.y,
  }));
