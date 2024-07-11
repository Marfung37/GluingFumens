"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = glueFumen;
var tetris_fumen_1 = require("tetris-fumen");
var defines_1 = require("./defines");
var HEIGHT = 20;
var WIDTH = 10;
var TETROMINO = 4;
var pieceMappings = {
    "T": [
        [[1, 0], [0, 0], [1, 1], [2, 0]],
        [[0, 1], [0, 0], [1, 1], [0, 2]],
        [[0, 1], [0, 0], [-1, 1], [1, 1]],
        [[0, 1], [0, 0], [-1, 1], [0, 2]],
    ],
    "I": [
        [[1, 0], [0, 0], [2, 0], [3, 0]],
        [[0, 2], [0, 0], [0, 1], [0, 3]],
    ],
    "L": [
        [[1, 0], [0, 0], [2, 0], [2, 1]],
        [[0, 1], [0, 0], [1, 0], [0, 2]],
        [[1, 1], [0, 0], [0, 1], [2, 1]],
        [[0, 1], [0, 0], [0, 2], [-1, 2]],
    ],
    "J": [
        [[1, 0], [0, 0], [0, 1], [2, 0]],
        [[0, 1], [0, 0], [0, 2], [1, 2]],
        [[-1, 1], [0, 0], [-2, 1], [0, 1]],
        [[1, 1], [0, 0], [1, 0], [1, 2]],
    ],
    "S": [
        [[1, 0], [0, 0], [1, 1], [2, 1]],
        [[-1, 1], [0, 0], [0, 1], [-1, 2]]
    ],
    "Z": [
        [[0, 0], [1, 0], [-1, 1], [0, 1]],
        [[0, 1], [0, 0], [1, 1], [1, 2]]
    ],
    "O": [
        [[0, 0], [1, 0], [0, 1], [1, 1]]
    ]
};
function height(field) {
    // accounting for newlines and no trailing newline and garbage line
    return ((field.str().length + 1) / (WIDTH + 1) - 1);
}
function isInside(field, x, y) {
    return (0 <= x && x < WIDTH) && (0 <= y && y < height(field));
}
function centerMino(minoPositions) {
    return minoPositions[0];
}
function placePiece(field, minoPositions, piece) {
    if (piece === void 0) { piece = 'X'; }
    for (var _i = 0, minoPositions_1 = minoPositions; _i < minoPositions_1.length; _i++) {
        var pos = minoPositions_1[_i];
        field.set(pos.x, pos.y, piece);
    }
}
function removeLineClears(field) {
    var lines = field.str().split("\n").slice(0, -1);
    var linesCleared = [];
    // go through each line to check if just gray minos
    for (var i = lines.length - 1; i >= 0; i--) {
        if (lines[i] === "X".repeat(WIDTH)) {
            lines.splice(i, 1); // remove line
            linesCleared.push(lines.length - i); // add relative line num that was cleared
        }
    }
    // create new field with the cleared field
    var newField = tetris_fumen_1.Field.create(lines.join(""));
    return {
        field: newField,
        linesCleared: linesCleared // relative line clear positions ex: [0, 0] (first two lines)
    };
}
// encode operations for faster comparisons
function encodeOp(operation) {
    // encode into 15 bit
    // type has 9 possible (4 bits)
    // rotation has 4 possible (2 bits)
    // x has WIDTH (10) possible (4 bits)
    // absY has height (20) possible (5 bits)
    // y has height (20) possible (5 bits)
    var ct = (0, defines_1.parsePiece)(operation.type);
    ct = (ct << 2) + (0, defines_1.parseRotation)(operation.rotation);
    ct = (ct << 4) + operation.x;
    ct = (ct << 5) + operation.absY;
    ct = (ct << 5) + operation.y;
    return ct;
}
function decodeOp(ct) {
    var y = ct & 0x1F;
    ct >>= 5;
    ct >>= 5; // remove the absolute Y position
    var x = ct & 0xF;
    ct >>= 4;
    var rotation = (0, defines_1.parseRotationName)(ct & 0x3);
    ct >>= 2;
    var type = (0, defines_1.parsePieceName)(ct);
    return {
        type: type,
        rotation: rotation,
        x: x,
        y: y
    };
}
function duplicateGlue(subArr, arrays) {
    // check if duplicate
    var duplicate = false;
    // new array without y but keep absolute y
    var absSubArr = subArr.map(function (x) { return x >> 5; });
    var arrSet = new Set(absSubArr);
    for (var _i = 0, arrays_1 = arrays; _i < arrays_1.length; _i++) {
        var arr = arrays_1[_i];
        // check if the two arrays are the same length
        if (subArr.length !== arr.length) {
            duplicate = false;
            break;
        }
        // check if two arrays are permutations
        var absArr = arr.map(function (x) { return x >> 5; });
        if (absArr.every(function (x) { return arrSet.has(x); })) {
            duplicate = true;
            break;
        }
    }
    return duplicate;
}
function makeEmptyField(field) {
    var emptyField = field.copy();
    var fieldHeight = height(field);
    for (var y = 0; y < fieldHeight; y++) {
        for (var x = 0; x < WIDTH; x++) {
            var piece = emptyField.at(x, y);
            if (piece.match(/[TILJSZO]/)) {
                emptyField.set(x, y, "_");
            }
        }
    }
    return emptyField;
}
function getMinoPositions(field, x, y, piece, rotationState, visualizeArr) {
    if (visualizeArr === void 0) { visualizeArr = null; }
    var minoPositions = [];
    // empty the field of all colored minos
    var visualizeField = null;
    if (visualizeArr !== null) {
        // create fumen of trying to put piece there
        visualizeField = makeEmptyField(field);
    }
    // for each position of a mino from rotation state
    for (var _i = 0, rotationState_1 = rotationState; _i < rotationState_1.length; _i++) {
        var pos = rotationState_1[_i];
        var px = x + pos[0];
        var py = y + pos[1];
        if (isInside(field, px, py)) {
            // add piece mino to field to visualize what it tried
            if (visualizeField !== null) {
                visualizeField.set(px, py, piece);
            }
            // mino matches the piece
            if (field.at(px, py) === piece) {
                minoPositions.push({ x: px, y: py });
            }
        }
    }
    // add page of it trying this piece and rotation
    if (visualizeField !== null && visualizeArr !== null) {
        visualizeArr.push({ field: visualizeField });
    }
    return minoPositions;
}
function glue(x0, y0, field, piecesArr, allPiecesArr, totalLinesCleared, visualizeArr, visualize) {
    var fieldHeight = height(field);
    var anyColorMinoFound = false;
    // scan through board for any colored minos
    for (var y = y0; y < fieldHeight; y++) {
        for (var x = (y == y0) ? x0 : 0; x < WIDTH; x++) {
            // if it is a piece
            var piece = field.at(x, y);
            if (piece.match(/[TILJSZO]/)) {
                anyColorMinoFound = true;
                // checking if one of the rotations works
                var rotationStates = pieceMappings[piece];
                for (var state = 0; state < rotationStates.length; state++) {
                    var newPiecesArr = __spreadArray([], piecesArr, true);
                    var minoPositions = getMinoPositions(field, x, y, piece, rotationStates[state], (visualize) ? visualizeArr : null);
                    // if there's less than minos
                    if (minoPositions.length < TETROMINO) {
                        continue;
                    }
                    // place piece
                    var newField = field.copy();
                    placePiece(newField, minoPositions);
                    // clear lines
                    var thisLinesCleared = void 0;
                    var data = removeLineClears(newField);
                    newField = data.field;
                    thisLinesCleared = data.linesCleared;
                    // determine the absolute position of the piece
                    var absY = centerMino(minoPositions).y;
                    for (var i = 0; i < totalLinesCleared.length && totalLinesCleared[i] < absY; i++) {
                        absY++;
                    }
                    // check if a line clear occurred
                    var startx = x;
                    var starty = y;
                    var newTotalLinesCleared = __spreadArray([], totalLinesCleared, true);
                    if (thisLinesCleared.length > 0) {
                        // start position to 0 otherwise it's where we left off scanning the field
                        startx = 0;
                        starty = 0;
                        // determine the absolute position of the line numbers
                        for (var _i = 0, thisLinesCleared_1 = thisLinesCleared; _i < thisLinesCleared_1.length; _i++) {
                            var lineNum = thisLinesCleared_1[_i];
                            var i = void 0;
                            for (i = 0; i < newTotalLinesCleared.length && newTotalLinesCleared[i] <= lineNum; i++) {
                                lineNum++;
                            }
                            newTotalLinesCleared.splice(i, 0, lineNum);
                        }
                    }
                    // a rotation that works
                    var operPiece = {
                        type: piece,
                        rotation: (0, defines_1.parseRotationName)(state),
                        x: centerMino(minoPositions).x,
                        y: centerMino(minoPositions).y,
                        absY: absY,
                    };
                    newPiecesArr.push(encodeOp(operPiece));
                    glue(startx, starty, newField, newPiecesArr, allPiecesArr, newTotalLinesCleared, visualizeArr, visualize);
                    // continue on with possiblity another piece could be placed instead of this one
                }
            }
        }
    }
    // if the field doesn't have any more pieces it's good
    if (!anyColorMinoFound && !duplicateGlue(piecesArr, allPiecesArr)) {
        allPiecesArr.push(piecesArr);
    }
}
function glueFumen(customInput, visualize) {
    if (customInput === void 0) { customInput = process.argv.slice(2); }
    if (visualize === void 0) { visualize = false; }
    var inputFumenCodes = [];
    if (!Array.isArray(customInput)) {
        customInput = [customInput];
    }
    for (var _i = 0, customInput_1 = customInput; _i < customInput_1.length; _i++) {
        var rawInput = customInput_1[_i];
        inputFumenCodes.push.apply(inputFumenCodes, rawInput.split(/\s/));
    }
    // all "global" variables
    var allFumens = [];
    var visualizeArr = [];
    var fumenIssues = 0;
    // for each fumen
    for (var _a = 0, inputFumenCodes_1 = inputFumenCodes; _a < inputFumenCodes_1.length; _a++) {
        var code = inputFumenCodes_1[_a];
        var inputPages = tetris_fumen_1.decoder.decode(code);
        var thisGlueFumens = []; // holds the glue fumens for this fumenCode
        // glue each page
        for (var _b = 0, inputPages_1 = inputPages; _b < inputPages_1.length; _b++) {
            var page = inputPages_1[_b];
            var field = page.field;
            var emptyField = makeEmptyField(field);
            var allPiecesArr = [];
            // try to glue this field and put into all pieces arr
            glue(0, 0, field, [], allPiecesArr, [], visualizeArr, visualize);
            // couldn't glue
            if (allPiecesArr.length == 0) {
                console.log(code + " couldn't be glued");
                fumenIssues++;
            }
            // each sequence of pieces
            for (var _c = 0, allPiecesArr_1 = allPiecesArr; _c < allPiecesArr_1.length; _c++) {
                var piecesArr = allPiecesArr_1[_c];
                var pages = [];
                pages.push({
                    field: emptyField,
                    operation: decodeOp(piecesArr[0])
                });
                for (var i = 1; i < piecesArr.length; i++) {
                    pages.push({
                        operation: decodeOp(piecesArr[i])
                    });
                }
                // add the final glue fumens to visualization
                if (visualize)
                    visualizeArr.push.apply(visualizeArr, pages);
                // the glued fumen for this inputted page
                var pieceFumen = tetris_fumen_1.encoder.encode(pages);
                thisGlueFumens.push(pieceFumen);
            }
            // multiple fumens from one page
            if (allPiecesArr.length > 1) {
                // multiple outputs warning
                allFumens.push("Warning: " + code + " led to " + allPiecesArr.length + " outputs");
            }
        }
        // add the glue fumens for this code to all the fumens
        allFumens.push.apply(allFumens, thisGlueFumens);
    }
    if (inputFumenCodes.length > allFumens.length) {
        console.log("Warning: " + fumenIssues + " fumens couldn't be glued");
    }
    // output visualization instead of glued fumens
    if (visualize)
        return [tetris_fumen_1.encoder.encode(visualizeArr)];
    // output glued fumens
    return allFumens;
}
if (require.main == module) {
    var allFumens = glueFumen();
    console.log(allFumens.join("\n"));
}
