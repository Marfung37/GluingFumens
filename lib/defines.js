"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMinoPiece = isMinoPiece;
exports.parsePieceName = parsePieceName;
exports.parsePiece = parsePiece;
exports.parseRotationName = parseRotationName;
exports.parseRotation = parseRotation;
function isMinoPiece(piece) {
    return piece !== 0 /* Piece.Empty */ && piece !== 8 /* Piece.Gray */;
}
function parsePieceName(piece) {
    switch (piece) {
        case 1 /* Piece.I */:
            return 'I';
        case 2 /* Piece.L */:
            return 'L';
        case 3 /* Piece.O */:
            return 'O';
        case 4 /* Piece.Z */:
            return 'Z';
        case 5 /* Piece.T */:
            return 'T';
        case 6 /* Piece.J */:
            return 'J';
        case 7 /* Piece.S */:
            return 'S';
        case 8 /* Piece.Gray */:
            return 'X';
        case 0 /* Piece.Empty */:
            return '_';
    }
}
function parsePiece(piece) {
    switch (piece.toUpperCase()) {
        case 'I':
            return 1 /* Piece.I */;
        case 'L':
            return 2 /* Piece.L */;
        case 'O':
            return 3 /* Piece.O */;
        case 'Z':
            return 4 /* Piece.Z */;
        case 'T':
            return 5 /* Piece.T */;
        case 'J':
            return 6 /* Piece.J */;
        case 'S':
            return 7 /* Piece.S */;
        case 'X':
            return 8 /* Piece.Gray */;
        case '_':
            return 0 /* Piece.Empty */;
    }
    throw new Error("Unknown piece: ".concat(piece));
}
function parseRotationName(rotation) {
    switch (rotation) {
        case 0 /* Rotation.Spawn */:
            return 'spawn';
        case 3 /* Rotation.Left */:
            return 'left';
        case 1 /* Rotation.Right */:
            return 'right';
        case 2 /* Rotation.Reverse */:
            return 'reverse';
    }
}
function parseRotation(rotation) {
    switch (rotation.toLowerCase()) {
        case 'spawn':
            return 0 /* Rotation.Spawn */;
        case 'left':
            return 3 /* Rotation.Left */;
        case 'right':
            return 1 /* Rotation.Right */;
        case 'reverse':
            return 2 /* Rotation.Reverse */;
    }
    throw new Error("Unknown rotation: ".concat(rotation));
}
