import { Piece, Rotation, WIDTH, pieceMappings } from './defines'; 
import { decoder, type Page } from 'tetris-fumen';
import type { Pos } from './types';
import EncodedField from './EncodedField';

/**
 * implementation of count trailing zeros by 
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32
 */
export function ctrz(x: number) {
  x >>>= 0; // coerce to Uint32
  if (x === 0) {
    // skipping this step would make it return -1
    return 32;
  }
  x &= -x; // equivalent to `int = int & (~int + 1)`
  return 31 - Math.clz32(x);
}

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
 * get position of center mino given bottom left mino
 */
export function bottomLeftToCenterMino(x: number, y: number, piece: Piece, rotation: Rotation): Pos {
  const offsets = getOffsets(piece, rotation);
  const centerIndex = centerMino(piece, rotation);

  const [bx, by] = offsets[centerIndex];
  return {x: x + bx, y: y + by};
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

  // get minos centered at given x, y
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

const VALID_PIECES = new Uint8Array(256);
VALID_PIECES['T'.charCodeAt(0)] = 1;
VALID_PIECES['I'.charCodeAt(0)] = 1;
VALID_PIECES['L'.charCodeAt(0)] = 1;
VALID_PIECES['J'.charCodeAt(0)] = 1;
VALID_PIECES['S'.charCodeAt(0)] = 1;
VALID_PIECES['Z'.charCodeAt(0)] = 1;
VALID_PIECES['O'.charCodeAt(0)] = 1;

/**
 * fast check if passed first char is a tetris piece
 */
export function isValidPieceChar(piece: string): boolean {
  return VALID_PIECES[piece.charCodeAt(0)] == 1;
}

/**
 * fast check if piece rather than X or _
 */
export function isMinoPiece(piece: Piece): boolean {
  return (piece & 0x7) != 0;
}

/**
 * checks if given position is within bounds
 */
export function inBounds(cell: Pos, height: number): boolean {
  return (0 <= cell.x && cell.x < WIDTH) && (0 <= cell.y && cell.y < height);
}

/**
 * get shifted y back up due to being shifted down from line clears
 */
export function clearOffset(y: number, rowsCleared: number): number {
  let mask = (1 << (y + 1)) - 1;

  // keep iterating until no more rows cleared below y
  while ((rowsCleared & mask) > 0) {
    // counts number of set bits before y
    while ((rowsCleared & mask) > 0) {
      rowsCleared &= rowsCleared - 1; 
      y++;
    }

    // update mask as could now have more rows under that were cleared
    mask = (1 << (y + 1)) - 1;
  }

  return y;
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
