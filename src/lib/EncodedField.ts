import { Piece, WIDTH } from './defines';
import { MinoType } from './types';
import { Field } from 'tetris-fumen';

const CELL_BIT_SHIFT: bigint = 4n;
const CELL_MASK: bigint = 0xFn;

// masks that detect for any empty cells in a row
const HIGH_BITS_MASK = 0x8888888888n; // masking 1000 at each four bits
const ADD_MASK       = 0x7777777777n; // masking 0111 at each four bits

// preprocessing

// a big int version of Piece
// prefers _ to be 0 for empty value
const BigIntPiece: Record<MinoType, bigint> = {
  T: 1n, I: 2n, L: 3n, J: 4n, S: 5n, Z: 6n, O: 7n, X: 8n, _: 0n
} as const;

// convert big int value of piece to Piece
const BigIntToPiece = new Array(9).fill(0).map((_, i) => 
  (i == 0) ? '_': Piece[i - 1]
)

// preprocess bit int lookup table for given x value
const SHIFT_LOOKUP = new Array(WIDTH).fill(0).map((_, x) => 
  BigInt(WIDTH - x - 1) * CELL_BIT_SHIFT
)

/**
 *  for a field 
 */
export default class EncodedField {
  private field: BigInt64Array;
  private height: number;

  /**
   * encode field into a int array where each int is a row indexing from bottom up
   */
  constructor(field: Field, height: number) {
    this.field = new BigInt64Array(height);
    this.height = height;
    const rows = field.str({garbage: false, reduced: true}).split('\n')

    // convert each cell into 4 bit int to pack into 40 bit int
    for (let y = 0; y < rows.length; y++) {
      const row = rows[rows.length - y - 1];
      for (const cell of row) {
        this.field[y] <<= CELL_BIT_SHIFT;
        this.field[y] |= BigIntPiece[cell as MinoType];
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

      // empty row
      if (encodedRow == 0n) continue;

      let row = "";
      for (let i = 0; i < WIDTH; i++) {
        row = BigIntToPiece[Number(encodedRow & CELL_MASK)] + row;
        encodedRow >>= CELL_BIT_SHIFT;
      }
      fieldStr += row;
    }
    return Field.create(fieldStr);
  }

  /**
   * get value at position
   */
  at(x: number, y: number): Piece {
    return Number((this.field[y] >> SHIFT_LOOKUP[x]) & CELL_MASK);
  }

  /**
   * set value at position assuming empty there
   */
  set(x: number, y: number, mino: MinoType): void {
    this.field[y] |= BigIntPiece[mino] << SHIFT_LOOKUP[x];
  }

  /**
   * checks if row at y value is all filled
   */
  isLineClear(y: number): boolean {
    const row = this.field[y];
    // row + ADD_MASK will set the high bit if the four bits are nonzero otherwise high bit is set
    // negate this to only have high bit to be set if zero
    // check if any high bits are set
    return (~(row + ADD_MASK) & HIGH_BITS_MASK) == 0n;
  }

  /**
   * clears line at y
   */
  lineClear(y: number): void {
    this.field.copyWithin(y, y + 1, this.height);
  }
}
