"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rotation = exports.Piece = void 0;
exports.encodeOp = encodeOp;
exports.decodeOp = decodeOp;
exports.isMinoPiece = isMinoPiece;
var Piece;
(function (Piece) {
    Piece[Piece["T"] = 0] = "T";
    Piece[Piece["I"] = 1] = "I";
    Piece[Piece["L"] = 2] = "L";
    Piece[Piece["J"] = 3] = "J";
    Piece[Piece["S"] = 4] = "S";
    Piece[Piece["Z"] = 5] = "Z";
    Piece[Piece["O"] = 6] = "O";
    Piece[Piece["X"] = 7] = "X";
    Piece[Piece["_"] = 8] = "_";
})(Piece || (exports.Piece = Piece = {}));
var Rotation;
(function (Rotation) {
    Rotation[Rotation["spawn"] = 0] = "spawn";
    Rotation[Rotation["right"] = 1] = "right";
    Rotation[Rotation["reverse"] = 2] = "reverse";
    Rotation[Rotation["left"] = 3] = "left";
})(Rotation || (exports.Rotation = Rotation = {}));
// encode operations for faster comparisons
function encodeOp(operation) {
    /** encode into 14 bit
      * type has 7 possible (3 bits)
      * rotation has 4 possible (2 bits)
      * x has WIDTH (10) possible (4 bits)
      * y has height (20) possible (5 bits)
      */
    var ct = Piece[operation.type];
    ct = (ct << 2) + Rotation[operation.rotation];
    ct = (ct << 4) + operation.x;
    ct = (ct << 5) + operation.y;
    return ct;
}
function decodeOp(ct) {
    var y = ct & 0x1F;
    ct >>= 5;
    var x = ct & 0xF;
    ct >>= 4;
    var rotation = Rotation[ct & 0x3];
    ct >>= 2;
    var type = Piece[ct];
    return {
        type: type,
        rotation: rotation,
        x: x,
        y: y
    };
}
var VALID_PIECES = new Uint8Array(256);
VALID_PIECES["T".charCodeAt(0)] = 1;
VALID_PIECES["I".charCodeAt(0)] = 1;
VALID_PIECES["L".charCodeAt(0)] = 1;
VALID_PIECES["J".charCodeAt(0)] = 1;
VALID_PIECES["S".charCodeAt(0)] = 1;
VALID_PIECES["Z".charCodeAt(0)] = 1;
VALID_PIECES["O".charCodeAt(0)] = 1;
function isMinoPiece(piece) {
    return VALID_PIECES[piece.charCodeAt(0)] === 1;
}
