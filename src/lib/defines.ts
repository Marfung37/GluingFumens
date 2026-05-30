import type { RotationType} from './types';

export enum Piece { T, I, L, J, S, Z, O, X, _ }
export enum Rotation { spawn, right, reverse, left }
export const rotations: RotationType[] = ['spawn', 'right', 'reverse', 'left']

export const HEIGHT = 20;
export const WIDTH = 10;
export const TETROMINO = 4;

// offset from bottom left most mino
// center mino is first index except for [SZ]/O which corresponds to rotation // 2 and rotation // 4
// last mino has same y value as bottom left most mino
export const pieceMappings: [number, number][][][] = [
  [ // T
    [[1, 0], [2, 0], [1, 1], [0, 0]],
    [[0, 1], [0, 2], [1, 1], [0, 0]],
    [[0, 1], [1, 1], [-1, 1], [0, 0]],
    [[0, 1], [0, 2], [-1, 1], [0, 0]],
  ],
  [ // I
    [[1, 0], [3, 0], [2, 0], [0, 0]],
    [[0, 2], [0, 3], [0, 1], [0, 0]],
  ],
  [ // L
    [[1, 0], [2, 1], [2, 0], [0, 0]],
    [[0, 1], [0, 2], [1, 0], [0, 0]],
    [[1, 1], [2, 1], [0, 1], [0, 0]],
    [[0, 1], [-1, 2], [0, 2], [0, 0]],
  ],
  [ // J
    [[1, 0], [2, 0], [0, 1], [0, 0]],
    [[0, 1], [1, 2], [0, 2], [0, 0]],
    [[-1, 1], [0, 1], [-2, 1], [0, 0]],
    [[1, 1], [1, 2], [1, 0], [0, 0]],
  ],
  [ // S
    [[1, 0], [1, 1], [2, 1], [0, 0]],
    [[-1, 1], [0, 1], [-1, 2], [0, 0]]
  ],
  [ // Z
    [[0, 0], [0, 1], [-1, 1], [1, 0]],
    [[0, 1], [1, 1], [1, 2], [0, 0]]
  ],
  [ // O
    [[0, 0], [0, 1], [1, 1], [1, 0]]
  ]
]
