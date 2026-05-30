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

export declare type PieceType = 'T' | 'I' | 'L' | 'J' | 'S' | 'Z' | 'O';
export declare type MinoType = PieceType | 'X' | '_';
export declare type RotationType = 'spawn' | 'right' | 'reverse' | 'left';

export type EncodedOperation = number;
