export interface Pos {
  x: number
  y: number
}
export interface Operation {
  type: PieceType;
  rotation: RotationType;
  x: number;
  y: number;
}

export type PieceType = 'T' | 'I' | 'L' | 'J' | 'S' | 'Z' | 'O';
export type MinoType = PieceType | 'X' | '_';
export type RotationType = 'spawn' | 'right' | 'reverse' | 'left';

export type Fumen = string;
export type EncodedOperation = number;
