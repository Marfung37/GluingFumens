import { Mino, WIDTH } from './defines';
import { MinoType } from './types';
import { Field } from 'tetris-fumen';

const CELL_BIT_SHIFT = 4;
const CELL_MASK = 0xF;

const IS_HIGH_CELL = [false, false, false, false, false, false, false, false, true, true];
const SHIFT_LOOKUP = [
  28, 24, 20, 16, 12, 8, 4, 0, // lowField shift for x
  4, 0                         // highField shift for x
];

const LOW_WIDTH = 8;
const HIGH_WIDTH = 2;

/**
 *  for a field 
 */
export default class EncodedField {
  // masks that detect for any empty cells in a row
  protected static readonly HIGH_BITS_MASK     = 0x8888888888n; // masking 1000 at each four bits
  protected static readonly NOT_HIGH_BITS_MASK = 0x7777777777n; // masking 0111 at each four bits

  protected lowField: Int32Array;
  protected highField: Int8Array;
  protected height: number;

  /**
   * encode field into a int array where each int is a row indexing from bottom up
   */
  constructor(field: Field, height: number) {
    // height is assumed to given as upper maximum
    this.lowField = new Int32Array(height);
    this.highField = new Int8Array(height);

    const rows = field.str({garbage: false, reduced: true}).split('\n').slice(-height);
    this.height = Math.min(rows.length, height);

    // convert each cell into 4 bit int 
    for (let y = 0; y < this.height; y++) {
      // read rows reversed as given where 0 is top left rather than bottom left
      const row = rows[this.height - y - 1];
      for (let i = 0; i < LOW_WIDTH; i++) {
        this.lowField[y] <<= CELL_BIT_SHIFT;
        this.lowField[y] |= Mino[row[i] as MinoType];
      }
      for (let i = LOW_WIDTH; i < WIDTH; i++) {
        this.highField[y] <<= CELL_BIT_SHIFT;
        this.highField[y] |= Mino[row[i] as MinoType];
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
      let encodedLowRow = this.lowField[y];
      let encodedHighRow = this.highField[y];

      let row = "";
      for (let i = 0; i < LOW_WIDTH; i++) {
        row = Mino[encodedLowRow & CELL_MASK] + row;
        encodedLowRow >>= CELL_BIT_SHIFT;
      }
      for (let i = LOW_WIDTH; i < WIDTH; i++) {
        row = Mino[encodedHighRow & CELL_MASK] + row;
        encodedHighRow >>= CELL_BIT_SHIFT;
      }

      fieldStr += row;
    }
    return Field.create(fieldStr);
  }

  /**
   * get value at position
   */
  at(x: number, y: number): Mino {
    const shift = SHIFT_LOOKUP[x];
    
    if (IS_HIGH_CELL[x]) {
      return (this.highField[y] >> shift) & CELL_MASK;
    } else {
      return (this.lowField[y] >> shift) & CELL_MASK;
    }
  }

  /**
   * unset value at position
   */
  unset(x: number, y: number): void {
    const shift = SHIFT_LOOKUP[x];

    if (IS_HIGH_CELL[x]) {
      this.highField[y] &= ~(0xF << shift);
    } else {
      this.lowField[y] &= ~(0xF << shift);
    }
  }

  /**
   * set value at position assuming empty there
   */
  set(x: number, y: number, mino: MinoType): void {
    this.height = Math.max(y + 1, this.height);

    const shift = SHIFT_LOOKUP[x];

    if (IS_HIGH_CELL[x]) {
      this.highField[y] &= Mino[mino] << shift;
    } else {
      this.lowField[y] &= Mino[mino] << shift;
    }
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
    const lowRow = this.lowField[y];
    const highRow = this.highField[y];

    // SWAR check on lower 32 bits (8 cells)
    const lowNotZero = ~(lowRow + 0x77777777);
    const lowClear = (lowNotZero & 0x88888888) === 0;

    // SWAR check on upper 8 bits (2 cells)
    const highNotZero = ~(highRow + 0x77);
    const highClear = (highNotZero & 0x88) === 0;

    return lowClear && highClear;
  }

  /**
   * clears line at y
   */
  lineClear(y: number): void {
    this.lowField.copyWithin(y, y + 1, this.height + 1);
    this.highField.copyWithin(y, y + 1, this.height + 1);
    this.height--;
  }

  /**
   * gives a copy of the field
   */
  copy(): EncodedField {
    const clone = Object.create(Object.getPrototypeOf(this));

    clone.height = this.height;
    clone.lowField = this.lowField.slice();
    clone.highField = this.highField.slice();

    return clone;
  }
}
