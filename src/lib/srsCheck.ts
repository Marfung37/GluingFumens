import { Mino, Rotation, WIDTH } from './defines';
import NumberRingQueue from './NumberRingQueue';
import EncodedField from './EncodedField';
import OperationEncoder from './OperationEncoder';
import type { Piece, EncodedOperation } from './types';
import MinosEncoder from './MinosEncoder';

const GLOBAL_VISITED = new Int32Array(512);
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
  const table = new Array(4);
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
  return kick_map[piece - 1][init_rot][target_rot];
}

function getSpawn(operation: EncodedOperation, height: number): EncodedOperation {
  operation = OperationEncoder.setX(operation, 4);
  operation = OperationEncoder.setY(operation, height);
  return operation;
}

function getNeighbors(field: EncodedField, operation: EncodedOperation): void {
  // shifts

  // left 1
  if (OperationEncoder.getX(operation) > 0) NEIGHBORS[0] = operation - (1 << 5);
  else NEIGHBORS[0] = -1;

  // right 1
  if (OperationEncoder.getX(operation) < WIDTH - 1) NEIGHBORS[1] = operation + (1 << 5);
  else NEIGHBORS[1] = -1;

  // down 1
  if (OperationEncoder.getY(operation) > 0)
    NEIGHBORS[2] = operation - 1; // down 1
  else NEIGHBORS[2] = -1;

  // rotations
  const currRotation = OperationEncoder.getRotation(operation);
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
function checkCollision(field: EncodedField, operation: EncodedOperation): boolean {
  let minos = OperationEncoder.positions(operation);
  if (minos == -1) return true;

  while (minos > 0) {
    const pos = MinosEncoder.getMino(minos);
    if (field.at(pos.x, pos.y) === Mino.X) return true;
    minos = MinosEncoder.nextMino(minos);
  }
  return false;
}

// get x, y new position from srs, assume operation has rotation set to target already
function kick(
  field: EncodedField,
  operation: EncodedOperation,
  init: Rotation,
  target: Rotation
): EncodedOperation {
  for (const [dx, dy] of get_kicks(OperationEncoder.getPiece(operation), init, target)) {
    const newOp = operation + (dx << 5) + dy;

    if (!checkCollision(field, newOp)) return newOp;
  }
  return -1;
}

function getSetVisited(index: number): boolean {
  const wordIndex = index >> 5; // divide by 32 for number of bits in int
  const bitIndex = index & 0x1f;
  const mask = 1 << bitIndex;

  const value = (GLOBAL_VISITED[wordIndex] & mask) !== 0;
  GLOBAL_VISITED[wordIndex] |= mask;
  return value;
}

export function checkSRS180(field: EncodedField, operation: EncodedOperation) {
  const startOp = getSpawn(operation, field.getHeight());
  if (operation == startOp) return true;

  const queue: NumberRingQueue = new NumberRingQueue(64);

  GLOBAL_VISITED.fill(0);

  // implementation of bfs on operations start
  queue.enqueue(startOp);
  getSetVisited(startOp);

  while (!queue.isEmpty()) {
    const currOp = queue.dequeue();
    getNeighbors(field, currOp);

    for (let i = 0; i < MAX_NEIGHBORS; i++) {
      const neighbor = NEIGHBORS[i];
      if (neighbor === -1) continue;
      if (neighbor === operation) return true;

      if (!getSetVisited(neighbor)) {
        if (i >= 3 || !checkCollision(field, neighbor)) queue.enqueue(neighbor);
      }
    }
  }

  return false;
}
