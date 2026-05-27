import {Field} from 'tetris-fumen';
import {
  Pos,
  Operation,
  Piece,
  Rotation,
  getHeight,
  HEIGHT,
  WIDTH,
  encodeOp,
  decodeOp,
  getX,
  getY,
  getRotation,
  getType,
  encodedOperation,
  getPieceMinos,
  inBounds
} from './defines';
import NumberRingQueue from './NumberRingQueue';

const GLOBAL_VISITED = new Int32Array(1024);
const MAX_NEIGHBORS = 6;
const NEIGHBORS = new Int16Array(MAX_NEIGHBORS);

const kick_offset_2x3: number[][][] = [
  // Spawn
  [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0]
  ],
  // CW
  [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2]
  ],
  // 180
  [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0]
  ],
  // CCW
  [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2]
  ]
];

const kick_offset_1x4: number[][][] = [
  // Spawn
  [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 0],
    [2, 0]
  ],
  // CW
  [
    [-1, 0],
    [0, 0],
    [0, 0],
    [0, 1],
    [0, -2]
  ],
  // 180
  [
    [-1, 1],
    [1, 1],
    [-2, 1],
    [1, 0],
    [-2, 0]
  ],
  // CCW
  [
    [0, 1],
    [0, 1],
    [0, 1],
    [0, -1],
    [0, 2]
  ]
];

const kick_offset_2x2: number[][][] = [
  // Spawn
  [[0, 0]],
  // CW
  [[0, -1]],
  // 180
  [[-1, -1]],
  // CCW
  [[-1, 0]]
];

const kick_offset_180_2x3: number[][][] = [
  // Spawn
  [
    [0, 0],
    [0, 1]
  ],
  // CW
  [
    [0, 0],
    [1, 0]
  ],
  // 180
  [
    [0, 0],
    [0, 0]
  ],
  // CCW
  [
    [0, 0],
    [0, 0]
  ]
];

const kick_offset_180_1x4: number[][][] = [
  // Spawn
  [
    [1, -1],
    [1, 0]
  ],
  // CW
  [
    [-1, -1],
    [0, -1]
  ],
  // 180
  [
    [0, 0],
    [0, 0]
  ],
  // CCW
  [
    [0, 0],
    [0, 0]
  ]
];

const kick_offset_180_2x2: number[][][] = [
  // Spawn
  [[1, 1]],
  // CW
  [[1, -1]],
  // 180
  [[0, 0]],
  // CCW
  [[0, 0]]
];

function gen_kick_table(offsets: number[][][], offsets_180: number[][][]) {
  let table = new Array(4);
  for (let a = 0; a < 4; a++) {
    table[a] = new Array(4);
    // None
    table[a][a] = [[0, 0]];
    // CW
    let b = spin_cw(a);
    table[a][b] = offsets[a].map((e, i) => e.map((f, j) => f - offsets[b][i][j]));
    // CCW
    b = spin_ccw(a);
    table[a][b] = offsets[a].map((e, i) => e.map((f, j) => f - offsets[b][i][j]));
    // 180
    b = spin_180(a);
    table[a][b] = offsets_180[a].map((e, i) => e.map((f, j) => f - offsets_180[b][i][j]));
  }
  return table;
}

const kicks_2x3 = gen_kick_table(kick_offset_2x3, kick_offset_180_2x3);
const kicks_1x4 = gen_kick_table(kick_offset_1x4, kick_offset_180_1x4);
const kicks_2x2 = gen_kick_table(kick_offset_2x2, kick_offset_180_2x2);

// TILJSZO order
export const kick_map = [
  kicks_2x3,
  kicks_1x4,
  kicks_2x3,
  kicks_2x3,
  kicks_2x3,
  kicks_2x3,
  kicks_2x2
];

export function spin_cw(rotation: Rotation): Rotation {
  return (rotation + 1) & 0x3;
}

export function spin_180(rotation: Rotation): Rotation {
  return (rotation + 2) & 0x3;
}

export function spin_ccw(rotation: Rotation): Rotation {
  return (rotation + 3) & 0x3;
}

export function get_kicks(piece: Piece, init_rot: Rotation, target_rot: Rotation): number[][] {
  return kick_map[piece]![init_rot][target_rot];
}

function getSpawn(height: number): Pos {
  return {x: 4, y: height};
}

function getNeighbors(field: Field, operation: encodedOperation, reverse: boolean = false): void {
  // shifts

  // left 1
  if (getX(operation) > 0)
    NEIGHBORS[0] = operation - (1 << 5);
  else
    NEIGHBORS[0] = -1;

  // right 1
  if (getX(operation) < WIDTH - 1)
    NEIGHBORS[1] = operation + (1 << 5);
  else
    NEIGHBORS[1] = -1;

  // down 1
  if (getY(operation) > 0)
    if (reverse)
      NEIGHBORS[2] = operation + 1; // up 1
    else
      NEIGHBORS[2] = operation - 1; // down 1
  else
    NEIGHBORS[2] = -1;

  // rotations
  const currRotation = getRotation(operation);
  const base = operation & ~(0x3 << 9);

  const cwRot = spin_cw(currRotation);
  const ccwRot = spin_ccw(currRotation);
  const r180 = spin_180(currRotation);

  NEIGHBORS[3] = base | (cwRot << 9); // cw
  NEIGHBORS[4] = base | (ccwRot << 9); // ccw
  NEIGHBORS[5] = base | (r180 << 9); // 180

  NEIGHBORS[3] = kick(field, NEIGHBORS[3], currRotation, cwRot);
  NEIGHBORS[4] = kick(field, NEIGHBORS[4], currRotation, ccwRot);
  NEIGHBORS[5] = kick(field, NEIGHBORS[5], currRotation, r180);
}

// for glue fumen collision only with gray minos (ie can go through colored minos)
function checkCollision(field: Field, operation: encodedOperation): boolean {
  const minos = getPieceMinos(operation);

  for (let mino of minos) {
    if (!inBounds(mino, HEIGHT)) return true;
    if (field.at(mino.x, mino.y) === 'X') return true;
  }
  return false;
}

// get x, y new position from srs, assume operation has rotation set to target already
function kick(field: Field, operation: encodedOperation, init: Rotation, target: Rotation): encodedOperation {
  for(let [dx, dy] of get_kicks(getType(operation), init, target)) {
    let newOp = operation + (dx << 5) + dy;

    if (!checkCollision(field, newOp)) return newOp;
  }
  return -1;
}

function getVisited(index: number, forward: boolean): boolean {
  if (!forward) index |= 1 << 14;
  const wordIndex = index >> 5; // divide by 32 for number of bits in int
  const bitIndex = index & 0x1F;
  const mask = 1 << bitIndex;

  return (GLOBAL_VISITED[wordIndex] & mask) !== 0;
}

function getSetVisited(index: number, forward: boolean): boolean {
  if (!forward) index |= 1 << 14;
  const wordIndex = index >> 5; // divide by 32 for number of bits in int
  const bitIndex = index & 0x1F;
  const mask = 1 << bitIndex;

  let value = (GLOBAL_VISITED[wordIndex] & mask) !== 0;
  GLOBAL_VISITED[wordIndex] |= mask;
  return value;
}

export function checkSRS180(field: Field, operation: Operation) {
  let targetOp = encodeOp(operation);
  let startOp = encodeOp({...operation, ...getSpawn(getHeight(field))});
  if (targetOp == startOp) return true;

  let forwardQueue: NumberRingQueue = new NumberRingQueue(64);
  let backwardQueue: NumberRingQueue = new NumberRingQueue(64);

  GLOBAL_VISITED.fill(0);

  // implementation of bfs on operations start
  forwardQueue.enqueue(startOp);
  backwardQueue.enqueue(targetOp);
  getSetVisited(startOp, true);
  getSetVisited(targetOp, false);

  while (!forwardQueue.isEmpty() && !backwardQueue.isEmpty()) {
    // process full levels from each bfs

    let fSize = forwardQueue.size;
    for (let l = 0; l < fSize; l++) {
      let currOp = forwardQueue.dequeue();
      getNeighbors(field, currOp, false);

      for (let i = 0; i < MAX_NEIGHBORS; i++) {
        let neighbor = NEIGHBORS[i];
        if (neighbor === -1) continue;
        if (getVisited(neighbor, false)) return true;

        if (!getSetVisited(neighbor, true)) {
          if (i >= 3 || !checkCollision(field, neighbor)) {
            forwardQueue.enqueue(neighbor);
          }
        }
      }
    }

    let bSize = backwardQueue.size;
    for (let l = 0; l < bSize; l++) {
      let currOp = backwardQueue.dequeue();
      getNeighbors(field, currOp, true);

      for (let i = 0; i < MAX_NEIGHBORS; i++) {
        let neighbor = NEIGHBORS[i];
        if (neighbor === -1) continue;
        if (getVisited(neighbor, true)) return true;

        if (!getSetVisited(neighbor, false)) {
          if (i >= 3 || !checkCollision(field, neighbor)) {
            backwardQueue.enqueue(neighbor);
          }
        }
      }
    }
  }

  return false;
}
