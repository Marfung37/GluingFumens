export interface Pos {
  x: number
  y: number
}
export interface Operation {
  type: PieceType;
  rotation: RotationType;
  x: number;
  y: number;
}
export enum Piece {
  T,
  I,
  L,
  J,
  S,
  Z,
  O,
  X,
  _
}
export enum Rotation {
  spawn,
  right,
  reverse,
  left
}
export declare type PieceType = 'T' | 'I' | 'L' | 'J' | 'S' | 'Z' | 'O';
export declare type MinoType = PieceType | 'X' | '_';
export declare type RotationType = 'spawn' | 'right' | 'reverse' | 'left';

export const pieceMappings: Record<PieceType, [number, number][][]> = {
  "T": [
    [[1, 0], [0, 0], [1, 1], [2, 0]],
    [[0, 1], [0, 0], [1, 1], [0, 2]],
    [[0, 1], [0, 0], [-1, 1], [1, 1]],
    [[0, 1], [0, 0], [-1, 1], [0, 2]],
    ],
  "I": [
    [[1, 0], [0, 0], [2, 0], [3, 0]],
    [[0, 2], [0, 0], [0, 1], [0, 3]],
    ],
  "L": [
    [[1, 0], [0, 0], [2, 0], [2, 1]],
    [[0, 1], [0, 0], [1, 0], [0, 2]],
    [[1, 1], [0, 0], [0, 1], [2, 1]],
    [[0, 1], [0, 0], [0, 2], [-1, 2]],
    ],
  "J": [
    [[1, 0], [0, 0], [0, 1], [2, 0]],
    [[0, 1], [0, 0], [0, 2], [1, 2]],
    [[-1, 1], [0, 0], [-2, 1], [0, 1]],
    [[1, 1], [0, 0], [1, 0], [1, 2]],
    ],
  "S": [
    [[1, 0], [0, 0], [1, 1], [2, 1]],
    [[-1, 1], [0, 0], [0, 1], [-1, 2]]
    ],
  "Z": [
    [[0, 0], [1, 0], [-1, 1], [0, 1]],
    [[0, 1], [0, 0], [1, 1], [1, 2]]
    ],
  "O": [
    [[0, 0], [1, 0], [0, 1], [1, 1]]
    ]
}

export type encodedOperation = number;

// encode operations for faster comparisons
export function encodeOp(operation: Operation): encodedOperation {
  /** encode into 14 bit
    * type has 7 possible (3 bits)
    * rotation has 4 possible (2 bits)
    * x has WIDTH (10) possible (4 bits)
    * y has height (20) possible (5 bits)
    */
  let ct = Piece[operation.type];
  ct = (ct << 2) + Rotation[operation.rotation];
  ct = (ct << 4) + operation.x;
  ct = (ct << 5) + operation.y;
  return ct;
}

export function decodeOp(ct: encodedOperation): Operation {
  let y = ct & 0x1F; ct >>= 5;
  let x = ct & 0xF; ct >>= 4;
  let rotation = Rotation[ct & 0x3]; ct >>= 2;
  let type = Piece[ct];

  return {
    type: type,
    rotation: rotation,
    x: x,
    y: y
  } as Operation
}

const VALID_PIECES = new Uint8Array(256);
VALID_PIECES["T".charCodeAt(0)] = 1;
VALID_PIECES["I".charCodeAt(0)] = 1;
VALID_PIECES["L".charCodeAt(0)] = 1;
VALID_PIECES["J".charCodeAt(0)] = 1;
VALID_PIECES["S".charCodeAt(0)] = 1;
VALID_PIECES["Z".charCodeAt(0)] = 1;
VALID_PIECES["O".charCodeAt(0)] = 1;

export function isMinoPiece(piece: MinoType): boolean {
  return VALID_PIECES[piece.charCodeAt(0)] === 1;
}
