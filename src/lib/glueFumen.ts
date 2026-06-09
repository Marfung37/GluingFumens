import type {
  Fumen,
  Pos,
  Operation,
  Piece,
  PieceType,
  MinoType,
  EncodedOperation,
  EncodedMinos
} from './types';
import { encoder, type Page, type Pages } from 'tetris-fumen';
import { Mino, Rotation, WIDTH, HEIGHT, TETROMINO, NUM_MINOS, pieceMappings } from './defines';
import {
  decodeWrapper,
  isValidPieceChar,
  bottomLeftToCenterMino,
  isMinoPiece,
  clearOffset,
  findLineClears,
  clearLines
} from './utils';
import OperationEncoder from './OperationEncoder';
import EncodedField from './EncodedField';
import MinosEncoder from './MinosEncoder';
import { checkSRS180 } from './srsCheck';

/**
 * modified operation with y value without shift down from line clears
 * to uniquely identify sequence of operations
 */
interface AbsoluteOperation extends Operation {
  absY: number;
}

type AbsoluteEncodedOperation = number;
type StrippedAbsoluteEncodedOperation = number;

abstract class AbsoluteOperationEncoder extends OperationEncoder {
  // put abs y before all other bits to be able to reuse functions
  static encode(operation: AbsoluteOperation): AbsoluteEncodedOperation {
    let ct = operation.absY << 14;
    ct |= super.encode(operation);
    return ct;
  }

  // update encoded operation with new absolute y value
  static update(operation: EncodedOperation, absY: number): AbsoluteEncodedOperation {
    let ct = absY << 14;
    ct |= operation;
    return ct;
  }

  // decode can just return Operation for these tasks

  static getAbsY(ct: AbsoluteEncodedOperation): number {
    return (ct >> 14) & 0x1f;
  }

  static stripY(ct: AbsoluteEncodedOperation): StrippedAbsoluteEncodedOperation {
    return ct >> 5;
  }
}

/**
 * For all functions 'X' is treated as the only filled cell in a field
 */

// modified EncodedField so only X is treated as filled cell
// also supports functions used only for glue fumen
export class EncodedFieldXFill extends EncodedField {
  /**
   * checks if row at y value is all filled
   */
  isLineClear(y: number): boolean {
    const row = this.field[y];
    // X is the only mino which has the high bit set of 4 bits
    return row === 0x8888888888;
  }

  /**
   * empty board of colored minos
   */
  emptyColored(): void {
    // can use mask for only X or _ to remain
    for (let y = 0; y < this.height; y++) {
      const row = this.field[y];

      // separate into 5 cell parts as & by converts to int32
      let lowPart = row & 0xfffff;
      let highPart = Math.floor(row / 0x100000);

      lowPart &= EncodedField.HIGH_BITS_MASK;
      highPart &= EncodedField.HIGH_BITS_MASK;

      this.field[y] = highPart * 0x100000 + (lowPart >>> 0);
    }
  }

  /**
   * checks if any colored minos are left
   */
  checkColored(): boolean {
    // can use bitwise not of mask to check
    for (let y = 0; y < this.height; y++) {
      const row = this.field[y];

      const lowPart = row & 0xfffff;
      const highPart = Math.floor(row / 0x100000);

      // if any of the low 3 bits of the cells are cell
      const check = (lowPart | highPart) & EncodedField.NOT_HIGH_BITS_MASK;
      if (check != 0) return true;
    }
    return false;
  }
}

/**
 * utility to place piece onto field
 * @returns rows modified as bit map
 */
function placePiece(field: EncodedField, minos: EncodedMinos, mino: MinoType = 'X'): number {
  let rowsModified = 0;
  for (let _ = 0; _ < TETROMINO; _++) {
    const pos = MinosEncoder.getMino(minos);

    field.unset(pos.x, pos.y);
    field.set(pos.x, pos.y, mino);
    rowsModified |= 1 << pos.y;

    minos = MinosEncoder.nextMino(minos);
  }
  return rowsModified;
}

/**
 * utility to count pieces on field by only if minos of each piece is divisible by 4
 */
function countPieces(field: EncodedField): number {
  // check if there's enough minos of each color to place pieces
  const frequencyCounter = new Uint8Array(NUM_MINOS - 1);
  const height = field.getHeight();
  let count = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const mino = field.at(x, y);
      if (isMinoPiece(mino)) {
        frequencyCounter[mino]++;
        count += Math.floor(frequencyCounter[mino] / TETROMINO);
        frequencyCounter[mino] %= TETROMINO;
      }
    }
  }

  if (frequencyCounter.every((value) => value == 0)) return count;
  return -1;
}

/**
 * checks if array is already in the arrays ignoring order
 */
function duplicateGlue(
  array: AbsoluteEncodedOperation[],
  arrays: AbsoluteEncodedOperation[][]
): boolean {
  // new array without y but keep absolute y
  const strippedArray = array.map(AbsoluteOperationEncoder.stripY);
  const arraySet = new Set<StrippedAbsoluteEncodedOperation>(strippedArray);

  for (const arr of arrays) {
    if (array.length !== arr.length) {
      return false;
    }

    // check if two arrays are permutations
    const absArr = arr.map(AbsoluteOperationEncoder.stripY);
    if (absArr.every((op) => arraySet.has(op))) {
      return true;
    }
  }

  return false;
}

/**
 * utility to convert X mino to 1 and all other to 0
 */
function XtoInt(mino: Mino): number {
  return mino >> 3;
}

/**
 * utility to check if there exist line clear under the piece such that the piece would be floating at this position
 * due to ignoring placement of pieces that float, an order that clears the lines under would prevent placement of this piece
 * a piece that does this leads to needing to check if those lines under can be cleared after placing it
 */
function checkWouldFloatPiece(field: EncodedFieldXFill, y: number, minos: EncodedMinos): boolean {
  // passed in y is the bottom most y value

  // y value too low to possible meet requirement
  if (y <= 1) return false;

  // check if supported above the bottom most minos of the piece
  // no matter how line clear occur piece cannot be floating
  let supportedAbove = true;
  const bottomMinoPositions: Pos[] = [];
  for (let _ = 0; _ < TETROMINO; _++) {
    const pos = MinosEncoder.getMino(minos);
    supportedAbove &&= pos.y != y && field.at(pos.x, pos.y - 1) == Mino.X;

    // find the bottom most minos
    if (pos.y == y) bottomMinoPositions.push({ ...pos });

    minos = MinosEncoder.nextMino(minos);
  }
  if (supportedAbove) return false;

  // use a bit map set to store which y values have some x under
  let XHeights: number = 0;
  const target: number = (1 << y) - (1 << Math.max(0, y - 5));

  // get which y values have some X under the bottom most minos
  for (const pos of bottomMinoPositions) {
    for (let newY = Math.max(0, y - 5); newY < y; newY++) {
      XHeights |= XtoInt(field.at(pos.x, newY)) << newY;
    }
    if (XHeights == target) return false;
  }
  return true;
}

// constants used by following function
const hangsLeftLS = (1 << Mino.L) | (1 << Mino.S);
const hangsLeftTLJZ = (1 << Mino.T) | (1 << Mino.L) | (1 << Mino.L) | (1 << Mino.Z);

/**
 * utility to find next cell to check after placing a piece
 * certain placements of a piece allow for placement of a piece previously floating or clears below current piece
 * getNewStart determines if it is possible and takes latest position possible to reduce redundant operations
 */
function getNewStart(
  field: EncodedFieldXFill,
  blx: number,
  bly: number,
  minos: EncodedMinos,
  floatingPieces: boolean
): Pos {
  // check if need to clear lines below as current placement could've prevented line clears
  if (!floatingPieces && checkWouldFloatPiece(field, bly, minos)) {
    // starting as far down to possibly get lines below to clear
    return { x: 0, y: Math.max(0, bly - 4) };
  }

  // get right most mino in current y
  // the first monomino is necessarily same y as bly
  const rmPos = { ...MinosEncoder.getMino(minos) };
  minos = MinosEncoder.nextMino(minos);
  while (minos > 0) {
    const pos = MinosEncoder.getMino(minos);
    if (pos.x > rmPos.x && bly == pos.y) {
      rmPos.x = pos.x;
      rmPos.y = pos.y;
    }

    minos = MinosEncoder.nextMino(minos);
  }

  // if on floor no need to check if previous values need to be checked again
  // if allow floating pieces then cannot require this piece to be place before previous piece can be placed
  if (floatingPieces || bly == 0 || bly == field.getHeight())
    return { x: (rmPos.x + 1) % WIDTH, y: bly + ~~((rmPos.x + 1) / WIDTH) };

  // if J hanging from left
  // __JJ___
  // __JX___
  // __J____
  if (blx >= 1 && field.at(blx - 1, bly - 1) == Mino.J && field.at(blx, bly + 1) == Mino.J) {
    return { x: blx - 1, y: bly - 1 };
  }

  // if L hanging from right
  // ___LL__
  // ___XL__
  // ____L__
  if (
    rmPos.x < WIDTH - 1 &&
    field.at(rmPos.x + 1, rmPos.y - 1) == Mino.L &&
    field.at(rmPos.x, rmPos.y + 1) == Mino.L
  ) {
    return { x: rmPos.x + 1, y: rmPos.y - 1 };
  }

  // if L or S hanging from left
  // _LLL___ or __SS___
  // _L_X___    _SSX___
  if (
    blx >= 2 &&
    field.at(blx - 2, bly) == field.at(blx, bly + 1) &&
    (hangsLeftLS & (1 << field.at(blx - 2, bly))) != 0
  ) {
    return { x: blx - 2, y: bly };
  }

  // if T, L, J, Z hanging from left
  // __T____ or _______ or ___Z___ or __JJ___
  // __TT___    __LLL__    __ZZ___    __JX___
  // __TX___    __LX___    __ZX___    __JX___
  if (blx >= 1 && (hangsLeftTLJZ & (1 << field.at(blx - 1, bly))) != 0) {
    // if J need also the X above then J
    if (field.at(blx - 1, bly) == Mino.J) {
      if (field.at(blx, bly + 1) == Mino.X && field.at(blx, bly + 2) == Mino.J)
        return { x: blx - 1, y: bly };

      // if TLZ just need to check above is corresponding TLZ
    } else if (field.at(blx - 1, bly) == field.at(blx, bly + 1)) return { x: blx - 1, y: bly };
  }

  return { x: (rmPos.x + 1) % WIDTH, y: bly + ~~((rmPos.x + 1) / WIDTH) };
}

/**
 * finds next valid colored mino starting at x, y
 */
function findColoredMino(
  x: number,
  y: number,
  field: EncodedField,
  order: Piece[] | null,
  hold: number
): (Pos & { orderIndex: number }) | null {
  const height = field.getHeight();
  for (; y < height; y++) {
    for (; x < WIDTH; x++) {
      const piece = field.at(x, y);

      // skip if not colored mino
      if (!isMinoPiece(piece)) continue;
      // only I could be on highest y value so skip if not I
      if (y == height - 1 && piece != Mino.I) continue;

      // if specified order
      let orderIndex = -1;
      if (order !== null) {
        for (let i = 0; i < hold + 1; i++) {
          if (order[i] == piece) orderIndex = i;
        }
        // didn't find colored mino fitting the order
        if (orderIndex == -1) continue;
      }

      return { x, y, orderIndex };
    }
    // start on new row
    x = 0;
  }
  return null;
}

/**
 * checks if given operation is actually placeable
 */
function checkPlaceable(
  operation: EncodedOperation,
  field: EncodedField,
  floatingPieces: boolean,
  srs180: boolean
): EncodedMinos {
  const height = field.getHeight();

  // get positions of the minos
  const minos = OperationEncoder.positions(operation);

  if (minos == -1) return -1;

  const piece = OperationEncoder.getPiece(operation);

  let floating = !floatingPieces;
  let tmpMinos = minos;
  for (let _ = 0; _ < TETROMINO; _++) {
    const pos = MinosEncoder.getMino(tmpMinos);

    if (pos.y >= height || field.at(pos.x, pos.y) !== piece) return -1;

    floating &&= pos.y != 0 && field.at(pos.x, pos.y - 1) != Mino.X;
    tmpMinos = MinosEncoder.nextMino(tmpMinos);
  }
  if (floating) return -1;
  if (srs180 && !checkSRS180(field, operation)) return -1;

  return minos;
}

/**
 * updates the rowsCleared using absolute y of the rows cleared for this state
 */
function getNewRowsCleared(rowsClearedNoOffset: number, rowsCleared: number): number {
  let newRowsCleared = rowsCleared;
  while (rowsClearedNoOffset > 0) {
    // get a row from bit string
    const row = 31 - Math.clz32(rowsClearedNoOffset);

    const newRow = clearOffset(row, rowsCleared);
    newRowsCleared |= 1 << newRow;

    // clear this bit
    rowsClearedNoOffset &= ~(1 << row);
  }
  return newRowsCleared;
}

interface glueState {
  x0: number;
  y0: number;
  field: EncodedFieldXFill;
  operations: AbsoluteEncodedOperation[];
  rowsCleared: number; // bit map of which rows were cleared
  order: Piece[] | null;
}

function glue(
  initialField: EncodedFieldXFill,
  solutionLimit: number,
  floatingPieces: boolean,
  initialOrder: Piece[] | null,
  hold: number,
  srs180: boolean
): AbsoluteEncodedOperation[][] {
  // check if possible to glue in first place
  const numPieces = countPieces(initialField);
  if (numPieces == -1) return [];
  if (numPieces == 0) return [[]]; // found solution of doing nothing

  const stack: glueState[] = [];
  const solutions: AbsoluteEncodedOperation[][] = [];

  // push the initial state
  stack.push({
    x0: 0,
    y0: 0,
    field: initialField,
    operations: [],
    rowsCleared: 0,
    order: initialOrder
  });

  while (stack.length > 0) {
    const { x0, y0, field, operations, rowsCleared, order } = stack.pop()!;

    // scan for colored minos
    const coloredPos = findColoredMino(x0, y0, field, order, hold);
    if (coloredPos === null) continue;
    const { x, y, orderIndex } = coloredPos;
    const piece = field.at(x, y) as Piece;

    // push stack current state starting at new x, y
    stack.push({
      x0: (x + 1) % WIDTH,
      y0: y + Math.floor((x + 1) / WIDTH),
      field,
      operations,
      rowsCleared,
      order
    });

    // found colored mino that could fit

    // go through rotations
    const numRotations = pieceMappings[piece].length;
    for (let rotation: Rotation = 0; rotation < numRotations; rotation++) {
      // construct operation
      const centerMino = bottomLeftToCenterMino(x, y, piece, rotation);
      let operation = OperationEncoder.encode({
        ...centerMino,
        type: Mino[piece],
        rotation: Rotation[rotation]
      } as Operation);

      // check placeable
      const minos = checkPlaceable(operation, field, floatingPieces, srs180);
      if (minos == -1) continue;

      // place piece
      const newField = field.copy() as EncodedFieldXFill;
      const rowsModified = placePiece(newField, minos);

      // clear lines
      const rowsToBeCleared = findLineClears(newField, rowsModified);
      clearLines(newField, rowsToBeCleared);

      // get absolute y of piece
      const absY = clearOffset(OperationEncoder.getY(operation), rowsCleared);
      operation = AbsoluteOperationEncoder.update(operation, absY);

      // check if place enough pieces to fill pieces and no colored left
      if (operations.length + 1 == numPieces && !newField.checkColored()) {
        // check if distinct new solution
        operations.push(operation);
        if (!duplicateGlue(operations, solutions)) {
          solutions.push(operations);
        }

        // terminate early if found solution limit
        if (solutions.length == solutionLimit) return solutions;
        continue;
      }

      // update rows cleared with absolute y positions
      const newRowsCleared = getNewRowsCleared(rowsToBeCleared, rowsCleared);

      // pick new x, y
      let [newX, newY] = [0, 0];
      if (rowsToBeCleared == 0 && order === null && !srs180) {
        // only smartly pick new start if no additional settings or line clears happened
        // order could prevent a previous placement that is now placeable
        // srs180 mainly confusing due to placing current piece can allow kick down
        const start = getNewStart(field, x, y, minos, floatingPieces);
        newX = start.x;
        newY = start.y;
      }

      // new order
      const newOrder = order?.slice() ?? null;
      if (newOrder !== null) newOrder.splice(orderIndex, 1);

      stack.push({
        x0: newX,
        y0: newY,
        field: newField,
        operations: [...operations, operation],
        rowsCleared: newRowsCleared,
        order: newOrder
      } as glueState);
    }
  }

  return solutions;
}

export default function glueFumen(
  fumen: Fumen,
  solutionLimit: number = 1,
  floatingPieces: boolean = false,
  order: string | null = null,
  hold: number = 0,
  srs180: boolean = false
): Fumen[] {
  const inputPages: Pages = decodeWrapper(fumen);
  const outputFumens: Fumen[] = [];

  // convert given order to proper form
  let initialOrder: Piece[] | null = null;
  if (order !== null) {
    // check if order contain only tetris pieces
    const pieces = Array.from(order);
    if (!pieces.every(isValidPieceChar))
      throw new Error(`Given order '${order}' does not consist of only tetris pieces`);
    initialOrder = pieces.map((piece: string) => Mino[piece as PieceType]);
  }

  // check hold is valid
  if (hold < 0) throw new Error(`Given hold expected to be nonnegative but ${hold} gotten`);

  // glue each page
  for (const page of inputPages) {
    const field = new EncodedFieldXFill(page.field, HEIGHT);

    // optimization due to srs180 with unlimited solutions extremely slow
    if (srs180 && solutionLimit < 1) {
      solutionLimit = glue(field, solutionLimit, floatingPieces, initialOrder, hold, false).length;
    }
    const solutions = glue(field, solutionLimit, floatingPieces, initialOrder, hold, srs180);

    // get field empty of any colored minos
    field.emptyColored();
    const emptyField = field.toField();

    for (const solution of solutions) {
      // convert operations into pages
      const pages = solution.map((op: AbsoluteEncodedOperation) => {
        return { operation: AbsoluteOperationEncoder.decode(op) } as Page;
      });

      // set the field
      if (solution.length == 0) {
        pages.push({ field: emptyField } as Page);
      } else {
        pages[0].field = emptyField;
      }

      outputFumens.push(encoder.encode(pages));
    }
  }

  // output glued fumens
  return outputFumens;
}
