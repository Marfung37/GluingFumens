import type { Pos, Operation, PieceType, MinoType, RotationType, EncodedOperation } from './types';
import { encoder, Field, type Page, type Pages } from 'tetris-fumen';
import { Rotation,  } from './defines';
import { Piece, WIDTH, TETROMINO, NUM_MINOS, pieceMappings } from './defines';
import { 
  decodeWrapper, 
  getHeight, 
  inBounds, 
  isMinoPiece, 
  findLineClears, 
  clearLines 
} from './utils';
import OperationEncoder from './OperationEncoder';
import EncodedField from './EncodedField';
import { checkSRS180 } from './srsCheck';

interface AbsoluteOperation extends Operation {
  absY: number
}

abstract class AbsoluteOperationEncoder extends OperationEncoder {
  // put abs y before all other bits to be able to reuse functions
  static encode(operation: AbsoluteOperation): EncodedOperation {
    let ct = operation.absY << 14;
    ct |= super.encode(operation);
    return ct;
  }

  // decode can just return Operation for these tasks

  static getAbsY(ct: EncodedOperation): number {
    return ct & 0x1F;
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
    // negate this to only have high bit to be set if zero
    // check if any high bits are set
    return (~row & EncodedField.HIGH_BITS_MASK) == 0n;
  }

  /**
   * empty board of colored minos
   */
  emptyColored(): void {
    // can use mask for only X or _ to remain
    for (let y = 0; y < this.height; y++) {
      this.field[y] &= EncodedField.HIGH_BITS_MASK;
    }
  }

  /**
   * checks if any colored minos are left
   */
  checkColored(): boolean {
    // can use bitwise not of mask to check
    for (let y = 0; y < this.height; y++) {
      const check = this.field[y] & EncodedField.NOT_HIGH_BITS_MASK;
      if (check != 0n) return true;
    }
    return false;
  }
}

function isFloating(field: EncodedField, minoPositions: Pos[]): boolean {
  // checks if any 'X' under any of the minos
  return minoPositions.every(pos =>
    // not on floor
    pos.y != 0 && field.at(pos.x, pos.y - 1) != Piece.X
  );
}

function placePiece(field: EncodedField, minoPositions: Pos[], mino: MinoType = 'X'): void {
  for (const pos of minoPositions)
    field.set(pos.x, pos.y, mino)
}

function checkGlueable(field: EncodedField, height: number): boolean {
  // check if there's enough minos of each color to place pieces
  const frequencyCounter = new Uint8Array(NUM_MINOS - 1);

  for (let y = 0; y < height; y++) {
    for(let x = 0; x < WIDTH; x++) {
      let mino = field.at(x, y);
      if (isMinoPiece(mino)) {
        frequencyCounter[mino]++;
        frequencyCounter[mino] &= 0x7; // mod 4
      }
    }
  }

  return frequencyCounter.every(value => value == 0)


// TODO: refactor all following functions

function checkWouldFloatPiece(field: Field, y: number, minoPositions: Pos[]): boolean {
  // check if this piece would be floating without the piece under it
  if(y === 0){
    return false
  }

  // check if there's X's all the way to the floor
  const XHeights: Set<number> = new Set<number>();

  for (let pos of minoPositions) {
    for (let newY = pos.y - 1; newY >= 0; newY--) {
      if(field.at(pos.x, newY) === 'X'){
        XHeights.add(newY)
      }
    } 

    let found = true;
    for (let checkY = 0; checkY < y; checkY++) {
      if(!XHeights.has(checkY)) {
        found = false;
        break;
      }
    }
    if(found) {
      return false;
    }
  }

  return true
}

function getNewStart(field: Field, height: number, x: number, y: number, minoPositions: Pos[]): Pos {
  // get new start with several checks if a piece is hanging or not
  // also check if maybe need to clear the lines below it

  if (checkWouldFloatPiece(field, y, minoPositions)) {
    // starting as far down to possibly get this line below to clear
    return {x: 0, y: Math.max(y - 4, 0)}
  }

  // get right most mino in current y
  const rightMostPos: Pos = minoPositions.reduce((maxPos, currentPos) => {
    return (currentPos.x > maxPos.x && y == currentPos.y) ? currentPos : maxPos;
    }, minoPositions[3]); // Initialize pair with same y

  let testMinoPositions: Pos[] = [];

  if(x > 0 && y > 0 && field.at(x - 1, y - 1) == 'J' && field.at(x, y + 1) == 'J') {
    testMinoPositions = getMinoPositions(field, height, x - 1, y - 1, 'J', pieceMappings['J'][1])
    if(testMinoPositions.length == TETROMINO){
      return {x: x - 1, y: y - 1}; // if J hanging from left
    }
  }
  if(y > 0 && field.at(rightMostPos.x + 1, rightMostPos.y - 1) == 'L' && field.at(rightMostPos.x, rightMostPos.y + 1) == 'L'){
    let testMinoPositions = getMinoPositions(field, height, rightMostPos.x + 1, rightMostPos.y - 1, 'L', pieceMappings['L'][3])
    if(testMinoPositions.length == TETROMINO){
      return {x: rightMostPos.x + 1, y: rightMostPos.y - 1}; // if L hanging from right
    }
  }
  if(x >= 2 && y > 0 && "LS".includes(field.at(x - 2, y)) && "LS".includes(field.at(x, y + 1))){
    switch(field.at(x - 2, y)){
      case 'L':
        testMinoPositions = getMinoPositions(field, height, x - 2, y, 'L', pieceMappings['L'][2])
        break;
      case 'S':
        testMinoPositions = getMinoPositions(field, height, x - 2, y, 'S', pieceMappings['S'][0])
        break;
    }
    if(testMinoPositions.length == TETROMINO)
      return {x: x - 2, y: y}; // if L or S hanging from the left
  }
  if(x >= 1 && y > 0 && "TLZ".includes(field.at(x - 1, y)) && "TLZ".includes(field.at(x, y + 1))){
    switch(field.at(x - 1, y)){
      case 'L':
        testMinoPositions = getMinoPositions(field, height, x - 1, y, 'L', pieceMappings['L'][2])
        break;
      case 'Z':
        testMinoPositions = getMinoPositions(field, height, x - 1, y, 'Z', pieceMappings['Z'][1])
        break;
      case 'T':
        testMinoPositions = getMinoPositions(field, height, x - 1, y, 'T', pieceMappings['T'][1])
        if(testMinoPositions.length != TETROMINO)
          testMinoPositions = getMinoPositions(field, height, x - 1, y, 'T', pieceMappings['T'][2]) // different rotation
        break;
    }
    if(testMinoPositions.length == TETROMINO)
      return {x: x - 1, y: y}; // if T, L (facing down), Z hanging from left
  }

  // at the end of the line
  if (rightMostPos.x == 9) {
    return {x: 0, y: y + 1}
  }

  return {x: rightMostPos.x + 1, y: y};
}

function getMinoPositions(
  field: Field, 
  height: number,
  x: number, 
  y: number, 
  piece: PieceType,
  rotationState: number[][],
  visualizeArr: Pages | null = null): Pos[]
{
  // x, y are bottom left mino of the piece
  let minoPositions: Pos[] = [];

  // empty the field of all colored minos
  let visualizeField: Field | null = null;
  if(visualizeArr !== null) {
    // create fumen of trying to put piece there
    visualizeField = makeEmptyField(field, height)
  }

  // for each position of a mino from rotation state
  for(let pos of rotationState){
    let px = x + pos[0];
    let py = y + pos[1];
    
    if(inBounds({x: px, y: py}, height)) {
      // add piece mino to field to visualize what it tried
      if(visualizeField !== null){
        visualizeField.set(px, py, piece);
      }

      // mino matches the piece
      if(field.at(px, py) === piece) {
        minoPositions.push({x: px, y: py} as Pos);
      // if not trying to visualize then failed to place
      } else if (visualizeField === null) {
        break
      }
    }
  }
  
  // add page of it trying this piece and rotation
  if(visualizeField !== null && visualizeArr !== null){
    visualizeArr.push({field: visualizeField} as Page);
  }

  return minoPositions;
}

function duplicateGlue(subArr: EncodedOperation[], arrays: EncodedOperation[][]): boolean {
  // check if duplicate

  // new array without y but keep absolute y
  let absSubArr = subArr.map((x: number) => x >> 5);
  const arrSet: Set<EncodedOperation> = new Set<EncodedOperation>(absSubArr);

  for(let arr of arrays) {
    if (subArr.length !== arr.length) {
      return false;
    }

    // check if two arrays are permutations
    let absArr = arr.map((x: number) => x >> 5);
    if(absArr.every((x) => arrSet.has(x))) {
      return true;
    }
  }

  return false;
}

function glue(
  x0: number,
  y0: number, 
  field: Field, 
  height: number,
  piecesArr: EncodedOperation[], 
  allPiecesArr: EncodedOperation[][],
  totalLinesCleared: number[], 
  visualizeArr: Pages, 
  expectedSolutions: number,
  visualize: boolean,
  order: string | null,
  hold: number,
  srs180: boolean
): void 
{
  // scan through board for any colored minos
  for(let y = y0; y < height; y++){
    for(let x = (y == y0) ? x0 : 0; x < WIDTH; x++){
      // if it is a piece
      let piece = field.at(x, y);

      // is actually a piece
      if(!isMinoPiece(piece)) continue;
      piece = piece as PieceType;

      // if specify order and the piece isn't the next possible piece in order
      let pieceIndexUsed = -1;
      if (order !== null) {
        if (!order.slice(0, hold + 1).includes(piece)) continue;
        pieceIndexUsed = order.indexOf(piece);
      }

      // if highest level and not I as I only piece could be place at highest level
      if(y == height - 1 && piece !== 'I')
        continue;

      // checking if one of the rotations works
      const rotationStates = pieceMappings[piece];
      for(let state: Rotation = 0; state < rotationStates.length; state++){
        let newPiecesArr = [...piecesArr];

        let minoPositions: Pos[] = getMinoPositions(
          field, height, x, y, piece, rotationStates[state],(visualize) ? visualizeArr : null
        );

        if (minoPositions.length < TETROMINO) continue;
        if (isFloating(field, minoPositions)) continue;

        let operPiece = {
          type: piece,
          rotation: Rotation[state] as RotationType,
          x: centerMino(minoPositions).x,
          y: centerMino(minoPositions).y
        }

        if (srs180 && !checkSRS180(field, operPiece)) continue;

        // place piece
        let newField = field.copy()
        placePiece(newField, minoPositions);

        // clear lines
        let thisLinesCleared: number[];
        let data = removeLineClears(newField, height);
        newField = data.field;
        thisLinesCleared = data.linesCleared;

        // determine the absolute position of the piece
        let absY = centerMino(minoPositions).y;
        for(let i = 0; i < totalLinesCleared.length && totalLinesCleared[i] <= absY; i++) {
          absY++;
        }

        // check if a line clear occurred
        let startPos: Pos = {x: 0, y: 0};
        let newTotalLinesCleared: number[] = [...totalLinesCleared];
        if(thisLinesCleared.length > 0){
          // determine the absolute position of the line numbers
          for(let lineNum of thisLinesCleared) {
            let i: number;
            for(i = 0; i < newTotalLinesCleared.length && newTotalLinesCleared[i] <= lineNum; i++){
              lineNum++;
            }
            newTotalLinesCleared.splice(i, 0, lineNum);
          }
        } else if (order === null) {
          startPos = getNewStart(field, height, x, y, minoPositions)
        }

        // a rotation that works
        let absOperPiece = {
          ...operPiece,
          absY: absY
        }
        newPiecesArr.push(encodeAbsOp(absOperPiece))

        const newOrder = (order !== null) ? order.slice(0, pieceIndexUsed) + order.slice(pieceIndexUsed + 1): null;

        glue(
          startPos.x, startPos.y, 
          newField, height - thisLinesCleared.length, 
          newPiecesArr, allPiecesArr, 
          newTotalLinesCleared, visualizeArr, 
          expectedSolutions, visualize, 
          newOrder, hold, srs180);

        if(expectedSolutions > 0 && allPiecesArr.length == expectedSolutions){
          return;
        }

        // continue on with possiblity another piece could be placed instead of this one
      }
    }
  }

  // if the field doesn't have any more pieces it's good
  if(!anyColoredMinos(field, height) && !duplicateGlue(piecesArr, allPiecesArr)){
    allPiecesArr.push(piecesArr);
  }
}

export function glueFumen(
  customInput: string | string[], 
  expectedSolutions: number = -1, 
  visualize: boolean = false, 
  order: string | null = null, 
  hold: number = 0, 
  srs180: boolean = false
){
  let inputFumenCodes: string[] = [];

  if(!Array.isArray(customInput)){
    customInput = [customInput];
  }

  for(let rawInput of customInput){
    inputFumenCodes.push(...rawInput.split(/\s/));
  }

  // all "global" variables
  let allFumens: string[] = [];
  let visualizeArr: Pages = [];
  let fumenIssues = 0;

  // for each fumen
  for(let code of inputFumenCodes){
    let inputPages: Pages = decodeWrapper(code);
    let thisGlueFumens: string[] = []; // holds the glue fumens for this fumenCode

    // glue each page
    for(let page of inputPages){
      let field: Field = page.field;
      let height: number = getHeight(field);
      let emptyField: Field = makeEmptyField(field, height);
      let allPiecesArr: EncodedOperation[][] = [];

      // try to glue this field and put into all pieces arr
      if(checkGlueable(field, height)){
        glue(0, 0, field, height, [], allPiecesArr, [], visualizeArr, expectedSolutions, visualize, order, hold, srs180);
      }
      
      // couldn't glue
      if(allPiecesArr.length == 0){
        console.log(code + " couldn't be glued");
        fumenIssues++;
      }

      // each sequence of pieces
      for(let piecesArr of allPiecesArr){
        let pages: Pages = [];
        pages.push({
          field: emptyField,
          ...((piecesArr.length > 0) ? {operation: decodeAbsOp(piecesArr[0])}: {})
        } as Page)
        for(let i = 1; i < piecesArr.length; i++){
          pages.push({
            operation: decodeAbsOp(piecesArr[i])
          } as Page)
        }

        // add the final glue fumens to visualization
        if(visualize)
          visualizeArr.push(...pages);

        // the glued fumen for this inputted page
        let pieceFumen: string = encoder.encode(pages);
        thisGlueFumens.push(pieceFumen);
      }

      // multiple fumens from one page
      if(allPiecesArr.length > 1){
        // multiple outputs warning
        allFumens.push("Warning: " + code + " led to " + allPiecesArr.length + " outputs");
      }
    }

    // add the glue fumens for this code to all the fumens
    allFumens.push(...thisGlueFumens)
  }
  if(inputFumenCodes.length > allFumens.length){
    console.log("Warning: " + fumenIssues + " fumens couldn't be glued");
  }

  // output visualization instead of glued fumens
  if(visualize)
    return [encoder.encode(visualizeArr)];

  // output glued fumens
  return allFumens
}
