// code based on https://github.com/Hsterts/Fumenities/blob/main/Fumen%20Utils_files/fumenutil/modified-unglueFumen.js
import { encoder } from 'tetris-fumen';
import { Piece, Rotation, HEIGHT } from './defines';
import { positions, decodeWrapper, findLineClears } from './utils';
import EncodedField from './EncodedField';

/**
 * get shifted y back up due to being shifted down from line clears
 */
function clearOffset(rowsCleared: number, y: number): number {
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
 * inverse of glueFumen the takes one fumen with operations and returns fumen with pieces placed
 */
export function unglueFumen(gluedFumen: string): string {
  // only one output for a glued fumen and assumes field isn't changed from first page
  const pages = decodeWrapper(gluedFumen);
  const field = new EncodedField(pages[0].field, HEIGHT);

  // bit string of which rows were modified
  let rowsModified: number = 0;
  // bit string of which rows are cleared
  let rowsCleared: number = 0;

  for (let page of pages) {
    const operation = page.operation;
    // ignore pages with no operation
    if (operation === undefined) continue;

    // get positions of minos of the piece
    let minos = positions(operation.x, operation.y, Piece[operation.type], Rotation[operation.rotation]);

    // set the field the corresponding mino and store what rows were modified
    for (let mino of minos) {
      mino.y = clearOffset(rowsCleared, mino.y);

      field.set(mino.x, mino.y, operation.type);
      rowsModified |= (1 << mino.y);
    }

    // check if modified lines had line clears if so store them
    rowsCleared |= findLineClears(field, rowsModified);
    rowsModified = 0;
  }
  
  return encoder.encode([{field: field.toField()}]);
}
