import { Piece, Rotation, HEIGHT, WIDTH, pieceMappings } from './defines'; 
import { decoder, Field, type Page } from 'tetris-fumen';
import type { Pos } from './types';
import EncodedField from './EncodedField';

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

/**
 * fast check if piece rather than X or _
 */
export function isMinoPiece(piece: Piece): boolean {
  return (piece & 0x7) != 0;
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

/**
 * get rows that are cleared
 */
export function findLineClears(field: EncodedField, rowsModified: number): number {
  let rowsCleared = 0;
  while (rowsModified > 0) {
    // get a row from bit string
    const row = 31 - Math.clz32(rowsModified);

    // add to rows cleared if row doesn't contain any empty cells
    if (field.isLineClear(row)) rowsCleared |= (1 << row);

    // clear this bit
    rowsModified &= ~(1 << row);
  }
  return rowsCleared;
}

/**
 * clears all rows given to be cleared
 */
export function clearLines(field: EncodedField, rowsToBeCleared: number): void {
  while (rowsToBeCleared > 0) {
    // get a row from bit string
    const row = 31 - Math.clz32(rowsToBeCleared);

    // clear this line
    field.lineClear(row)

    // clear this bit
    rowsToBeCleared &= ~(1 << row);
  }
}
