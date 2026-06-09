import { Mino, WIDTH, HEIGHT } from './defines';
import { MinoType } from './types';
import { Field } from 'tetris-fumen';

const CELL_BIT_SHIFT = 4;
const CELL_DIVISOR = 16;
const CELL_MASK = 0xf;

// value to divide by to shift right or left for x value
const SHIFT_DIVISOR = new Float32Array(WIDTH).map((_, x) =>
  Math.pow(2, (WIDTH - x - 1) * CELL_BIT_SHIFT)
);

/**
 *  Encodes a field into an array of 64 bit floats,
 *  allowing for faster operations of getting and setting cell data
 */
export default class EncodedField {
  // masks that detect for any empty cells in a row
  protected static readonly HIGH_BITS_MASK = 0x88888; // masking 1000 at each four bits
  protected static readonly NOT_HIGH_BITS_MASK = 0x77777; // masking 0111 at each four bits

  protected field: number[];
  protected height: number;

  /**
   * Takes a Field from tetris-fumen and converts to more efficient Field object
   *
   * @param field - Field from tetris-fumen
   * @param height - maximum number of rows the field will ever have, default 20
   *
   * @returns An object with the main functions of a Field
   *
   * @example
   * import { Field } from 'tetris-fumen';
   * const field = new EncodedField(Field.create());
   * field.set(0, 0, 'I');
   * console.log(field.toField().str());
   */
  constructor(field: Field, height: number = HEIGHT) {
    // height is assumed to given as upper maximum
    this.field = new Array(height).fill(0);

    const rawField = field.str({ garbage: false, reduced: true });

    if (!rawField) {
      this.height = 0;
      return;
    }

    const rows = rawField.split('\n').slice(-height);
    this.height = Math.min(rows.length, height);

    // convert each cell into 4 bit int
    for (let y = 0; y < this.height; y++) {
      // read rows reversed as given where 0 is top left rather than bottom left
      const row = rows[this.height - y - 1];
      for (let i = 0; i < WIDTH; i++) {
        this.field[y] *= CELL_DIVISOR;
        this.field[y] += Mino[row[i] as MinoType];
      }
    }
  }

  /**
   * Decode the EncodedField back to a Field from tetris-fumen
   *
   * @returns Field object from tetris-fumen
   */
  toField(): Field {
    // convert encoded field into a string for Field
    let fieldStr = '';
    for (let y = this.height - 1; y >= 0; y--) {
      let encodedRow = this.field[y];

      let row = '';
      for (let i = 0; i < WIDTH; i++) {
        row = Mino[encodedRow & CELL_MASK] + row;
        encodedRow = Math.floor(encodedRow / CELL_DIVISOR);
      }

      fieldStr += row;
    }
    return Field.create(fieldStr);
  }

  /**
   * Get value of cell at x, y position
   *
   * @param x - The horizontal column index (0-index, left-to-right)
   * @param y - The vertical row index (0-index, bottom-to-top)
   *
   * @returns value of cell as Mino enum value
   *
   * @note Passing coordinates out of bounds results in **undefined behavior**
   */
  at(x: number, y: number): Mino {
    return ~~(this.field[y] / SHIFT_DIVISOR[x]) & CELL_MASK;
  }

  /**
   * Clears value of cell at x, y position to empty cell
   *
   * @param x - The horizontal column index (0-index, left-to-right)
   * @param y - The vertical row index (0-index, bottom-to-top)
   *
   * @note Passing coordinates out of bounds results in **undefined behavior**
   */
  unset(x: number, y: number): void {
    const currentCellVal = ~~(this.field[y] / SHIFT_DIVISOR[x]) & CELL_MASK;
    this.field[y] -= currentCellVal * SHIFT_DIVISOR[x];
  }

  /**
   * Set value of cell at x, y position if cell is **empty**
   *
   * @param x - The horizontal column index (0-index, left-to-right)
   * @param y - The vertical row index (0-index, bottom-to-top)
   * @param mino - The type of mino value from '_TILJSZOX'
   *
   * @note Passing coordinates out of bounds results in **undefined behavior**
   * @note Setting a nonempty cell results in **undefined behavior**
   */
  set(x: number, y: number, mino: MinoType): void {
    this.height = y + 1 > this.height ? y + 1 : this.height; // max of y + 1 and current height
    this.field[y] += Mino[mino] * SHIFT_DIVISOR[x];
  }

  /**
   * Get an upper bound of the height of the field
   *
   * @returns upper bound for the height of the field
   */
  getHeight(): number {
    return this.height;
  }

  /**
   * Checks if given row at y value is all filled
   *
   * @param y - The vertical row index (0-index, bottom-to-top)
   *
   * @returns boolean whether the row is all filled
   */
  isLineClear(y: number): boolean {
    const row = this.field[y];

    // separate into 5 cell parts as & by converts to int32
    const lowPart = row & 0xfffff;
    const highPart = Math.floor(row / 0x100000);

    // check if all cells are not empty cells by adding 0b111 in each cell, if not empty then the bit in 0b1000 is set for each cell
    const lowClear =
      ((lowPart + EncodedField.NOT_HIGH_BITS_MASK) & EncodedField.HIGH_BITS_MASK) ===
      EncodedField.HIGH_BITS_MASK;
    const highClear =
      ((highPart + EncodedField.NOT_HIGH_BITS_MASK) & EncodedField.HIGH_BITS_MASK) ===
      EncodedField.HIGH_BITS_MASK;

    return lowClear && highClear;
  }

  /**
   * Clears given row at y value regardless if row if filled
   *
   * @param y - The vertical row index (0-index, bottom-to-top)
   */
  lineClear(y: number): void {
    this.field.copyWithin(y, y + 1, this.height + 1);
    this.height--;
  }

  /**
   * Gives a copy of the EncodedField
   *
   * @returns a deep copy of current object
   */
  copy(): EncodedField {
    const clone = Object.create(Object.getPrototypeOf(this));

    clone.height = this.height;
    clone.field = this.field.slice();

    return clone;
  }
}
