import { Pos, Piece, EncodedMinos } from './types';
import { getOffsets, centerMino, inBounds } from './utils';
import { Rotation, WIDTH, HEIGHT } from './defines';

const POS_SHIFT = Math.pow(2, 9);

const MEMO_SIZE = WIDTH * HEIGHT * 7 * 4;
const memo = new Float64Array(MEMO_SIZE).fill(NaN);

/**
 * Static class with functions for getting position of minos of a piece
 * as packed number
 */
export default abstract class MinosEncoder {
  private constructor() {}

  /**
   * Get positions of minos of a piece as a number
   *
   * @param x - The horizontal column index of center mino (0-index, left-to-right)
   * @param y - The vertical row index of center mino (0-index, bottom-to-top)
   * @param piece - The piece using Mino enum for TILJSZO
   * @param rotation - The rotation using Rotation enum for spawn, right, reverse, or left
   *
   * @returns a number that packs all the positions of the minos of the piece
   */
  static positions(x: number, y: number, piece: Piece, rotation: Rotation): EncodedMinos {
    const key = x * 560 + y * 28 + piece * 4 + rotation;

    if (key >= MEMO_SIZE) return -1;
    if (!isNaN(memo[key])) return memo[key];

    // get offset and center index
    const offsets = getOffsets(piece, rotation);
    const centerIndex = centerMino(piece, rotation);

    // get base x, y offset of center mino
    const [bx, by] = offsets[centerIndex];

    // get cells centered at given x, y
    let minos = 0;
    for (const [dx, dy] of offsets) {
      const newX = x + dx - bx;
      const newY = y + dy - by;
      if (!inBounds(newX, newY)) {
        minos = -1;
        break;
      }

      const monomino = (newX << 5) + newY;
      minos *= POS_SHIFT;
      minos += monomino;
    }

    memo[key] = minos;
    return minos;
  }

  /**
   * Gets a mino position as Pos object from the EncodedMinos
   * outputed by the positions function
   *
   * @param minos - EncodedMinos number outputed from the positions or nextMino functions
   *
   * @returns a Pos object of the x, y value of the mino on a field
   */
  static getMino(minos: EncodedMinos): Pos {
    const y = minos & 0x1f;
    const x = (minos >> 5) & 0xf;
    return { x, y };
  }

  /**
   * Shifts the minos such that getMino will return the next mino position
   *
   * @param minos - EncodedMinos number outputed from the positions or nextMino functions
   *
   * @returns a EncodedMinos number shifted to move to the next mino in the packed number
   */
  static nextMino(minos: EncodedMinos): EncodedMinos {
    return Math.floor(minos / POS_SHIFT);
  }
}
