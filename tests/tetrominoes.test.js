import { describe, expect, it } from "vitest";
import { cellsForPiece, getOffsets } from "../html5/src/js/core/tetrominoes.js";

describe("tetromino definitions", () => {
  it("normalizes rotation indexes", () => {
    expect(getOffsets("T", -1)).toEqual(getOffsets("T", 3));
    expect(getOffsets("T", 5)).toEqual(getOffsets("T", 1));
  });

  it("builds absolute piece cells", () => {
    const piece = { type: "O", rotation: 0, x: 4, y: 7 };
    expect(cellsForPiece(piece)).toEqual([
      { x: 5, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 8 },
      { x: 6, y: 8 },
    ]);
  });
});
