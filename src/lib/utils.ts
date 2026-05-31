import { Piece, Rotation, HEIGHT, WIDTH, pieceMappings } from './defines'; 
import { decoder, Field, type Page } from 'tetris-fumen';
import type { Pos, MinoType } from './types';

/**
 * get offsets of a piece, rotation pair
 */
export function getOffsets(piece: Piece, rotation: Rotation): [number, number][] {
  const offsetsPerRotation = pieceMappings[piece];
  const rotationsUpToSymmetry = offsetsPerRotation.length;

  // mod out symmetry
  rotation %= rotationsUpToSymmetry
  return offsetsPerRotation[rotation];
}

/**
 * get index of the center mino
 */
export function centerMino(piece: Piece, rotation: Rotation): number {
  // pieceMappings stores number of rotations up to symmetry
  // center mino is only difference between the distinct rotations
  const rotationsUpToSymmetry = pieceMappings[piece].length;
  return Math.floor(rotation / rotationsUpToSymmetry);
}

/**
 * get positions of minos of a piece
 */
export function positions(x: number, y: number, piece: Piece, rotation: Rotation): Pos[] {
  // get offset and center index
  const offsets = getOffsets(piece, rotation);
  const centerIndex = centerMino(piece, rotation);

  // get base x, y offset of center mino
  const [bx, by] = offsets[centerIndex];

  // get minos centered at given x,y from operation
  const minos: Pos[] = [];
  for (let [dx, dy] of offsets) {
    let mino = {x: x + dx - bx, y: y + dy - by};
    minos.push(mino);
  }

  return minos;
}

/**
 * basic wrapper on decode for better error message
 */
export function decodeWrapper(fumen: string): Page[] {
  try {
    return decoder.decode(fumen);
  } catch (e) {
    throw new Error(`Fumen ${fumen} could not be decoded`);
  }
}

// bit map for what characters are tetris pieces
const VALID_PIECES = new Uint8Array(256);
VALID_PIECES["T".charCodeAt(0)] = 1;
VALID_PIECES["I".charCodeAt(0)] = 1;
VALID_PIECES["L".charCodeAt(0)] = 1;
VALID_PIECES["J".charCodeAt(0)] = 1;
VALID_PIECES["S".charCodeAt(0)] = 1;
VALID_PIECES["Z".charCodeAt(0)] = 1;
VALID_PIECES["O".charCodeAt(0)] = 1;

/**
 * fast check if piece rather than X or _
 */
export function isMinoPiece(piece: MinoType): boolean {
  return VALID_PIECES[piece.charCodeAt(0)] === 1;
}

/**
 * get the height of the field
 */
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

/**
 * checks if given position is within bounds
 */
export function inBounds(cell: Pos, height: number): boolean {
  return (0 <= cell.x && cell.x < WIDTH) && (0 <= cell.y && cell.y < height);
}
