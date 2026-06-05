import { Pos, Piece, MinosPosition } from './types';
import { getOffsets, centerMino, inBounds } from './utils';
import { Rotation, WIDTH, HEIGHT } from './defines';

const POS_SHIFT = Math.pow(2, 9);

const MEMO_SIZE = WIDTH * HEIGHT * 7 * 4
let memo = new Float64Array(MEMO_SIZE).fill(NaN);

// output for position of a mino to avoid initialization of objects
const pos = {x: 0, y: 0};

export default abstract class MinosEncoder {
  private constructor() {};

  /**
   * get positions of minos of a piece
   */
  static positions(x: number, y: number, piece: Piece, rotation: Rotation): MinosPosition {
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
    for (let [dx, dy] of offsets) {
      const newX = x + dx - bx;
      const newY = y + dy - by;
      if (!inBounds(newX, newY)) {
        minos = -1;
        break;
      }

      let monomino = (newX << 5) + newY;
      minos *= POS_SHIFT;
      minos += monomino;
    }

    memo[key] = minos;
    return minos;
  }

  /**
   * get x, y from right most mino from encoded piece position
   */
  static getMino(minos: MinosPosition): Pos {
    pos.y = minos & 0x1F;
    pos.x = (minos >> 5) & 0xF;
    return pos;
  }

  /**
   * get next mino from encoded piece position
   */
  static nextMino(minos: MinosPosition) {
    return Math.floor(minos / POS_SHIFT);
  }
}
