// code based on https://github.com/Hsterts/Fumenities/blob/main/Fumen%20Utils_files/fumenutil/modified-unglueFumen.js
import { encoder, Field } from 'tetris-fumen';
import {
  WIDTH,
  encodeOp,
  getPieceMinos,
  decodeWrapper
} from './defines';
import type { Operation } from './defines';

// shift y back up due to being shifted down from line clears
function clearOffset(rowsCleared: number, y: number): number {
  let mask = (1 << (y + 1)) - 1;

  // keep iterating until no more rows cleared below y
  while ((rowsCleared & mask) > 0) {
    // counts number of set bits before y
    while ((rowsCleared & mask) > 0) {
      rowsCleared &= rowsCleared - 1; 
      y++;
    }

    mask = (1 << (y + 1)) - 1;
  }

  return y;
}

// get rows that are cleared
function findLineClears(field: Field, rowsModified: number): number {
  let rowsCleared = 0;
  while (rowsModified > 0) {
    // get a row from bit string
    const row = 31 - Math.clz32(rowsModified);

    // add to rows cleared if row doesn't contain any empty cells
    let x = 0;
    for (; x < WIDTH; x++)
      if (field.at(x, row) === '_') break; 

    if (x == WIDTH) rowsCleared |= (1 << row);

    // clear this bit
    rowsModified &= ~(1 << row);
  }
  return rowsCleared;
}

// only one output for a glued fumen and assumes field isn't changed from first page
export function unglueFumen(gluedFumen: string): string {
  const pages = decodeWrapper(gluedFumen);
  const field = pages[0].field;

  // bit string of which rows were modified
  let rowsModified: number = 0;
  // bit string of which rows are cleared
  let rowsCleared: number = 0;

  for (let page of pages) {
    if (page.operation === undefined) continue;
    let minos = getPieceMinos(encodeOp(page.operation as Operation));
    
    // set the field the corresponding mino and store what rows were modified
    for (let mino of minos) {
      mino.y = clearOffset(rowsCleared, mino.y);
      field.set(mino.x, mino.y, page.operation.type);
      rowsModified |= (1 << mino.y);
    }
    // check if modified lines had line clears if so store them
    rowsCleared |= findLineClears(field, rowsModified);
    rowsModified = 0;
  }
  
  return encoder.encode([{field}]);
}
