// code very loosely based on https://github.com/Hsterts/Fumenities/blob/main/Fumen%20Utils_files/fumenutil/modified-unglueFumen.js
import { encoder } from 'tetris-fumen';
import { Mino, Rotation, HEIGHT, TETROMINO } from './defines';
import { decodeWrapper, clearOffset, findLineClears } from './utils';
import { Piece } from './types';
import EncodedField from './EncodedField';
import MinosEncoder from './MinosEncoder';

/**
 * inverse of glueFumen the takes one fumen with operations and returns fumen with pieces placed
 */
export default function unglueFumen(gluedFumen: string): string {
  // only one output for a glued fumen and assumes field isn't changed from first page
  const pages = decodeWrapper(gluedFumen);
  const field = new EncodedField(pages[0].field, HEIGHT);

  // bit string of which rows were modified
  let rowsModified: number = 0;
  // bit string of which rows are cleared
  let rowsCleared: number = 0;

  for (const page of pages) {
    const operation = page.operation;
    // ignore pages with no operation
    if (operation === undefined) continue;

    // get positions of minos of the piece
    let minos = MinosEncoder.positions(
      operation.x,
      operation.y,
      Mino[operation.type] as Piece,
      Rotation[operation.rotation]
    );
    if (minos == -1) throw new Error('One of the pieces goes off the board');

    // set the field the corresponding mino and store what rows were modified
    for (let _ = 0; _ < TETROMINO; _++) {
      const pos = MinosEncoder.getMino(minos);

      pos.y = clearOffset(pos.y, rowsCleared);

      field.set(pos.x, pos.y, operation.type);
      rowsModified |= 1 << pos.y;
      minos = MinosEncoder.nextMino(minos);
    }

    // check if modified lines had line clears if so store them
    rowsCleared |= findLineClears(field, rowsModified);
    rowsModified = 0;
  }

  return encoder.encode([{ field: field.toField() }]);
}
