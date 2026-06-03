import { Mino, WIDTH } from './defines';
import { MinoType } from './types';
import { Field } from 'tetris-fumen';

const CELL_BIT_SHIFT = 4;
const CELL_DIVISOR = 16;
const CELL_MASK = 0xF;

// value to divide by to shift right or left for x value
const SHIFT_DIVISOR = new Float32Array(WIDTH).map((_, x) => 
  Math.pow(2, (WIDTH - x - 1) * CELL_BIT_SHIFT)
);

/**
 *  for a field 
 */
export default class EncodedField {
  // masks that detect for any empty cells in a row
  protected static readonly HIGH_BITS_MASK     = 0x88888; // masking 1000 at each four bits
  protected static readonly NOT_HIGH_BITS_MASK = 0x77777; // masking 0111 at each four bits

  protected field: number[];
  protected height: number;

  /**
   * encode field into a int array where each int is a row indexing from bottom up
   */
  constructor(field: Field, height: number) {
    // height is assumed to given as upper maximum
    this.field = new Array(height).fill(0);

    const rawField = field.str({garbage: false, reduced: true});

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
   * decode the encoded field back to a Field
   */
  toField(): Field {
    // convert encoded field into a string for Field
    let fieldStr = "";
    for (let y = this.height - 1; y >= 0; y--) {
      let encodedRow = this.field[y];

      let row = "";
      for (let i = 0; i < WIDTH; i++) {
        row = Mino[encodedRow & CELL_MASK] + row;
        encodedRow = Math.floor(encodedRow / CELL_DIVISOR);
      }

      fieldStr += row;
    }
    return Field.create(fieldStr);
  }

  /**
   * get value at position
   */
  at(x: number, y: number): Mino {
    return ~~(this.field[y] / SHIFT_DIVISOR[x]) & CELL_MASK;
  }

  /**
   * unset value at position
   */
  unset(x: number, y: number): void {
    const currentCellVal = ~~(this.field[y] / SHIFT_DIVISOR[x]) & CELL_MASK;
    this.field[y] -= currentCellVal * SHIFT_DIVISOR[x];
  }

  /**
   * set value at position assuming empty there
   */
  set(x: number, y: number, mino: MinoType): void {
    this.height = Math.max(y + 1, this.height);
    this.field[y] += Mino[mino] * SHIFT_DIVISOR[x];
  }

  /**
   * get the height, only guranteed to be upper bound
   */
  getHeight(): number {
    return this.height;
  }

  /**
   * checks if row at y value is all filled
   */
  isLineClear(y: number): boolean {
    const row = this.field[y];

    // separate into 5 cell parts as & by converts to int32
    const lowPart = row & 0xFFFFF;
    const highPart = Math.floor(row / 0x100000);

    // check if all cells are not empty cells by adding 0b111 in each cell, if not empty then the bit in 0b1000 is set for each cell
    const lowClear = ((lowPart + EncodedField.NOT_HIGH_BITS_MASK) & EncodedField.HIGH_BITS_MASK) === EncodedField.HIGH_BITS_MASK;
    const highClear = ((highPart + EncodedField.NOT_HIGH_BITS_MASK) & EncodedField.HIGH_BITS_MASK) === EncodedField.HIGH_BITS_MASK;

    return lowClear && highClear;
  }

  /**
   * clears line at y
   */
  lineClear(y: number): void {
    this.field.copyWithin(y, y + 1, this.height + 1);
    this.height--;
  }

  /**
   * gives a copy of the field
   */
  copy(): EncodedField {
    const clone = Object.create(Object.getPrototypeOf(this));

    clone.height = this.height;
    clone.field = this.field.slice();

    return clone;
  }
}
