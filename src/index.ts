// src/index.ts

// main functions
export { default as glueFumen } from './lib/glueFumen';
export { default as unglueFumen } from './lib/unglueFumen';

// classes
export { default as OperationEncoder } from './lib/OperationEncoder';
export { default as EncodedField } from './lib/EncodedField';
export { default as MinosEncoder } from './lib/MinosEncoder';

// enums and constants
export { Mino, Rotation, WIDTH, HEIGHT, TETROMINO } from './lib/defines';

// types
export type { 
  Pos,
  Operation,
  Piece,
  PieceType,
  MinoType,
  RotationType,
  Fumen,
  EncodedOperation,
  EncodedMinos
} from './lib/types';
