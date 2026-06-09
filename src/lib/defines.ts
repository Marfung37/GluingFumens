export enum Mino {
  _,
  T,
  I,
  L,
  J,
  S,
  Z,
  O,
  X
}
export enum Rotation {
  spawn,
  right,
  reverse,
  left
}

/**
 * Width of Tetris board
 */
export const WIDTH = 10;

/**
 * Height of Tetris board
 */
export const HEIGHT = 20;

/**
 * Number of minos in a tetromino
 */
export const TETROMINO = 4;
export const NUM_MINOS = 9;

// offset from bottom left most mino
// center mino is first index except for [SZ]/O which corresponds to rotation // 2 and rotation // 4
// last mino has same y value as bottom left most mino
export const pieceMappings: [number, number][][][] = [
  [], // _
  [
    // T
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [0, 0]
    ],
    [
      [0, 1],
      [0, 2],
      [1, 1],
      [0, 0]
    ],
    [
      [0, 1],
      [1, 1],
      [-1, 1],
      [0, 0]
    ],
    [
      [0, 1],
      [0, 2],
      [-1, 1],
      [0, 0]
    ]
  ],
  [
    // I
    [
      [1, 0],
      [2, 0],
      [3, 0],
      [0, 0]
    ],
    [
      [0, 2],
      [0, 1],
      [0, 3],
      [0, 0]
    ]
  ],
  [
    // L
    [
      [1, 0],
      [2, 1],
      [2, 0],
      [0, 0]
    ],
    [
      [0, 1],
      [0, 2],
      [1, 0],
      [0, 0]
    ],
    [
      [1, 1],
      [2, 1],
      [0, 1],
      [0, 0]
    ],
    [
      [0, 1],
      [-1, 2],
      [0, 2],
      [0, 0]
    ]
  ],
  [
    // J
    [
      [1, 0],
      [2, 0],
      [0, 1],
      [0, 0]
    ],
    [
      [0, 1],
      [1, 2],
      [0, 2],
      [0, 0]
    ],
    [
      [-1, 1],
      [0, 1],
      [-2, 1],
      [0, 0]
    ],
    [
      [1, 1],
      [1, 2],
      [1, 0],
      [0, 0]
    ]
  ],
  [
    // S
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [0, 0]
    ],
    [
      [-1, 1],
      [0, 1],
      [-1, 2],
      [0, 0]
    ]
  ],
  [
    // Z
    [
      [0, 0],
      [0, 1],
      [-1, 1],
      [1, 0]
    ],
    [
      [0, 1],
      [1, 1],
      [1, 2],
      [0, 0]
    ]
  ],
  [
    // O
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0]
    ]
  ]
];
