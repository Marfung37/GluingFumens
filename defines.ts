"use strict";

export class Pos {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    *[Symbol.iterator](): IterableIterator<number> {
        yield this.x;
        yield this.y;
    }
}
export interface Operation {
    type: PieceType;
    rotation: RotationType;
    x: number;
    y: number;
}
export declare enum Piece {
    Empty = 0,
    I = 1,
    L = 2,
    O = 3,
    Z = 4,
    T = 5,
    J = 6,
    S = 7,
    Gray = 8
}
export declare enum Rotation {
    Spawn = 0,
    Right = 1,
    Reverse = 2,
    Left = 3
}
export declare type PieceType = 'I' | 'L' | 'O' | 'Z' | 'T' | 'J' | 'S' | 'X' | '_';
export declare type RotationType = 'spawn' | 'right' | 'reverse' | 'left';

export function isMinoPiece(piece: Piece): boolean {
    return piece !== Piece.Empty && piece !== Piece.Gray;
}

export function parsePieceName(piece: Piece): PieceType {
    switch (piece) {
        case Piece.I:
            return 'I';
        case Piece.L:
            return 'L';
        case Piece.O:
            return 'O';
        case Piece.Z:
            return 'Z';
        case Piece.T:
            return 'T';
        case Piece.J:
            return 'J';
        case Piece.S:
            return 'S';
        case Piece.Gray:
            return 'X';
        case Piece.Empty:
            return '_';
    }
}

export function parsePiece(piece: PieceType): Piece {
    switch (piece.toUpperCase()) {
        case 'I':
            return Piece.I;
        case 'L':
            return Piece.L;
        case 'O':
            return Piece.O;
        case 'Z':
            return Piece.Z;
        case 'T':
            return Piece.T;
        case 'J':
            return Piece.J;
        case 'S':
            return Piece.S;
        case 'X':
            return Piece.Gray;
        case '_':
            return Piece.Empty;
    }
    throw new Error("Unknown piece: ".concat(piece));
}

export function parseRotationName(rotation: Rotation): RotationType {
    switch (rotation) {
        case Rotation.Spawn:
            return 'spawn';
        case Rotation.Left:
            return 'left';
        case Rotation.Right:
            return 'right';
        case Rotation.Reverse:
            return 'reverse';
    }
}

export function parseRotation(rotation: RotationType): Rotation {
    switch (rotation.toLowerCase()) {
        case 'spawn':
            return Rotation.Spawn;
        case 'left':
            return Rotation.Left;
        case 'right':
            return Rotation.Right;
        case 'reverse':
            return Rotation.Reverse;
    }
    throw new Error("Unknown rotation: ".concat(rotation));
}
