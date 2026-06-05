import { Pos, Piece, EncodedPiecePosition } from './types';
import { getOffsets, centerMino, inBounds } from './utils';
import { Rotation, WIDTH, HEIGHT } from './defines';

const POS_SHIFT = Math.pow(2, 9);

const MEMO_SIZE = WIDTH * HEIGHT * 7 * 4
let memo = new Float64Array(MEMO_SIZE).fill(NaN);

// output for position of a monomino to avoid initialization of objects
const pos = {x: 0, y: 0};

export default abstract class PiecePositionEncoder {
  private constructor() {};

  /**
   * get positions of monominos of a piece
   */
  static positions(x: number, y: number, piece: Piece, rotation: Rotation): EncodedPiecePosition {
    const key = x * 560 + y * 28 + piece * 4 + rotation;

    if (key >= MEMO_SIZE) return -1;
    if (!isNaN(memo[key])) return memo[key];

    // get offset and center index
    const offsets = getOffsets(piece, rotation);
    const centerIndex = centerMino(piece, rotation);

    // get base x, y offset of center mino
    const [bx, by] = offsets[centerIndex];

    // get cells centered at given x, y
    let monominos = 0;
    for (let [dx, dy] of offsets) {
      const newX = x + dx - bx;
      const newY = y + dy - by;
      if (!inBounds(newX, newY)) {
        monominos = -1;
        break;
      }

      let monomino = (newX << 5) + newY;
      monominos *= POS_SHIFT;
      monominos += monomino;
    }

    memo[key] = monominos;
    return monominos;
  }

  static getMonomino(monominos: EncodedPiecePosition): Pos {
    pos.y = monominos & 0x1F;
    pos.x = (monominos >> 5) & 0xF;
    return pos;
  }

  static nextMonomino(monominos: EncodedPiecePosition) {
    return Math.floor(monominos / POS_SHIFT);
  }
}
