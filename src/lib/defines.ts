import { decoder, Field, type Page } from 'tetris-fumen';

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

export const rotations: RotationType[] = ['spawn', 'right', 'reverse', 'left']

export const HEIGHT = 20;
export const WIDTH = 10;
export const TETROMINO = 4;

// offset from bottom left most mino
// center mino is first index except for [SZ]/O which corresponds to rotation // 2 and rotation // 4
// last mino has same y value as bottom left most mino
export const pieceMappings: Record<PieceType, [number, number][][]> = {
  "T": [
    [[1, 0], [2, 0], [1, 1], [0, 0]],
    [[0, 1], [0, 2], [1, 1], [0, 0]],
    [[0, 1], [1, 1], [-1, 1], [0, 0]],
    [[0, 1], [0, 2], [-1, 1], [0, 0]],
    ],
  "I": [
    [[1, 0], [3, 0], [2, 0], [0, 0]],
    [[0, 2], [0, 3], [0, 1], [0, 0]],
    ],
  "L": [
    [[1, 0], [2, 1], [2, 0], [0, 0]],
    [[0, 1], [0, 2], [1, 0], [0, 0]],
    [[1, 1], [2, 1], [0, 1], [0, 0]],
    [[0, 1], [-1, 2], [0, 2], [0, 0]],
    ],
  "J": [
    [[1, 0], [2, 0], [0, 1], [0, 0]],
    [[0, 1], [1, 2], [0, 2], [0, 0]],
    [[-1, 1], [0, 1], [-2, 1], [0, 0]],
    [[1, 1], [1, 2], [1, 0], [0, 0]],
    ],
  "S": [
    [[1, 0], [1, 1], [2, 1], [0, 0]],
    [[-1, 1], [0, 1], [-1, 2], [0, 0]]
    ],
  "Z": [
    [[0, 0], [0, 1], [-1, 1], [1, 0]],
    [[0, 1], [1, 1], [1, 2], [0, 0]]
    ],
  "O": [
    [[0, 0], [0, 1], [1, 1], [1, 0]]
    ]
}

export function decodeWrapper(fumen: string): Page[] {
  let pages: Page[];
  try {
    pages = decoder.decode(fumen);
  } catch (e) {
    throw new Error(`Fumen ${fumen} could not be decoded`);
  }

  return pages;
}

export type EncodedOperation = number;

// encode operations for faster comparisons
export function encodeOp(operation: Operation): EncodedOperation {
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

export function decodeOp(ct: EncodedOperation): Operation {
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

export function getY(ct: EncodedOperation): number {
  return ct & 0x1F;
}

export function getX(ct: EncodedOperation): number {
  return (ct >> 5) & 0xF;
}

export function getRotation(ct: EncodedOperation): number {
  return (ct >> 9) & 0x3;
}

export function getType(ct: EncodedOperation): number {
  return ct >> 11;
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

export function getHeight(field: Field): number {
  // accounting for newlines and no trailing newline and garbage line
  for (let y = HEIGHT - 1; y >= 0; y--) {
    for (let x = 0; x < WIDTH; x++) {
      if (field.at(x, y) !== '_') {
        return y + 1;
      }
    }
  }
  return 0;
}

export function inBounds(cell: Pos, height: number): boolean {
  return (0 <= cell.x && cell.x < WIDTH) && (0 <= cell.y && cell.y < height);
}

export function getPieceMinos(operation: EncodedOperation): Pos[] {
  let minos: Pos[] = [];

  let rotationStates = pieceMappings[Piece[getType(operation)] as PieceType];
  let offsets = rotationStates[getRotation(operation) % rotationStates.length];

  // center index in the offsets
  const centerIndex = Math.floor(getRotation(operation) / rotationStates.length);
  const [bx, by] = offsets[centerIndex];
  for (let [dx, dy] of offsets) {
    let mino = {x: getX(operation) + dx - bx, y: getY(operation) + dy - by};
    minos.push(mino);
  }

  return minos;
}
