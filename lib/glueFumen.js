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
    ],
    "X": [],
    "_": []
};
function getHeight(field) {
    // accounting for newlines and no trailing newline and garbage line
    for (var y = HEIGHT - 1; y >= 0; y--) {
        for (var x = 0; x < WIDTH; x++) {
            if ("TILJSZOX".includes(field.at(x, y))) {
                return y + 1;
            }
        }
    }
    return 0;
}
function isInside(height, x, y) {
    return (0 <= x && x < WIDTH) && (0 <= y && y < height);
}
function isFloating(field, minoPositions) {
    // if there's a 'X' under any of the minos
    return minoPositions.every(function (pos) {
        // not on floor
        return pos.y != 0 && field.at(pos.x, pos.y - 1) != 'X';
    });
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
function removeLineClears(field, height) {
    // line clearing is done internally by tetris-fumen in PlayField
    // but here we want to only clear rows that are all `X`s
    // to avoid serializing the field, we directly alter the field
    var newField = field.copy();
    var currentRow = 0;
    var sourceRow = 0;
    var linesCleared = [];
    while (sourceRow < height) {
        var greyRow = true;
        for (var x = 0; x < WIDTH; x++) {
            if (field.at(x, sourceRow) !== "X") {
                greyRow = false;
                break;
            }
        }
        if (greyRow) {
            // ignore this source row, use the row above as source instead
            // record cleared line, since all rows below are filled, 
            // currentRow is exactly the relative line number of the cleared row
            linesCleared.push(currentRow);
            sourceRow++;
        }
        else {
            // only need to copy from sourceRow when the rows are different
            if (currentRow != sourceRow) {
                // copy from source to current
                for (var x = 0; x < WIDTH; x++) {
                    newField.set(x, currentRow, newField.at(x, sourceRow));
                }
            }
            // move to the next row above
            currentRow++;
            sourceRow++;
        }
    }
    // blank out remaining rows
    for (var y = currentRow + 1; y < height; y++) {
        for (var x = 0; x < WIDTH; x++) {
            newField.set(x, y, "_");
        }
    }
    return {
        field: newField,
        linesCleared: linesCleared // relative line clear positions ex: [0, 0] (bottommost two lines)
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
function anyColoredMinos(field, height) {
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < WIDTH; x++) {
            if ("TILJSZO".includes(field.at(x, y))) {
                return true;
            }
        }
    }
    return false;
}
function makeEmptyField(field, height) {
    var emptyField = field.copy();
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < WIDTH; x++) {
            var piece = emptyField.at(x, y);
            if ("TILJSZO".includes(piece)) {
                emptyField.set(x, y, "_");
            }
        }
    }
    return emptyField;
}
function checkGlueable(field, height) {
    // check if there's enough minos of each color to place pieces
    var frequencyCounter = {};
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < WIDTH; x++) {
            var char = field.at(x, y);
            frequencyCounter[char] = (frequencyCounter[char] || 0) + 1;
        }
    }
    for (var char in frequencyCounter) {
        if ("TILJSZO".includes(char)) {
            if (frequencyCounter[char] % TETROMINO != 0) {
                return false;
            }
        }
    }
    return true;
}
function checkWouldFloatPiece(field, y, minoPositions) {
    // check if this piece would be floating without the piece under it
    if (y === 0) {
        return false;
    }
    // check if there's X's all the way to the floor
    var XHeights = new Set();
    for (var _i = 0, minoPositions_2 = minoPositions; _i < minoPositions_2.length; _i++) {
        var pos = minoPositions_2[_i];
        for (var newY = pos.y - 1; newY >= 0; newY--) {
            if (field.at(pos.x, newY) === 'X') {
                XHeights.add(newY);
            }
        }
        var found = true;
        for (var checkY = 0; checkY < y; checkY++) {
            if (!XHeights.has(checkY)) {
                found = false;
                break;
            }
        }
        if (found) {
            return false;
        }
    }
    return true;
}
function getNewStart(field, height, x, y, minoPositions) {
    // get new start with several checks if a piece is hanging or not
    // also check if maybe need to clear the lines below it
    if (checkWouldFloatPiece(field, y, minoPositions)) {
        // starting as far down to possibly get this line below to clear
        return { x: 0, y: Math.max(y - 4, 0) };
    }
    // get right most mino in current y
    var rightMostPos = minoPositions.reduce(function (maxPos, currentPos) {
        return (currentPos.x > maxPos.x && y == currentPos.y) ? currentPos : maxPos;
    }, minoPositions[1]); // Initialize pair with same y
    var testMinoPositions = [];
    if (x > 0 && y > 0 && field.at(x - 1, y - 1) == 'J' && field.at(x, y + 1) == 'J') {
        testMinoPositions = getMinoPositions(field, height, x - 1, y - 1, 'J', pieceMappings['J'][1]);
        if (testMinoPositions.length == TETROMINO) {
            return { x: x - 1, y: y - 1 }; // if J hanging from left
        }
    }
    if (y > 0 && field.at(rightMostPos.x + 1, rightMostPos.y - 1) == 'L' && field.at(rightMostPos.x, rightMostPos.y + 1) == 'L') {
        var testMinoPositions_1 = getMinoPositions(field, height, rightMostPos.x + 1, rightMostPos.y - 1, 'L', pieceMappings['L'][3]);
        if (testMinoPositions_1.length == TETROMINO) {
            return { x: rightMostPos.x + 1, y: rightMostPos.y - 1 }; // if L hanging from right
        }
    }
    if (x >= 2 && y > 0 && "LS".includes(field.at(x - 2, y)) && "LS".includes(field.at(x, y + 1))) {
        switch (field.at(x - 2, y)) {
            case 'L':
                testMinoPositions = getMinoPositions(field, height, x - 2, y, 'L', pieceMappings['L'][2]);
                break;
            case 'S':
                testMinoPositions = getMinoPositions(field, height, x - 2, y, 'S', pieceMappings['S'][0]);
                break;
        }
        if (testMinoPositions.length == TETROMINO)
            return { x: x - 2, y: y }; // if L or S hanging from the left
    }
    if (x >= 1 && y > 0 && "TLZ".includes(field.at(x - 1, y)) && "TLZ".includes(field.at(x, y + 1))) {
        switch (field.at(x - 1, y)) {
            case 'L':
                testMinoPositions = getMinoPositions(field, height, x - 1, y, 'L', pieceMappings['L'][2]);
                break;
            case 'Z':
                testMinoPositions = getMinoPositions(field, height, x - 1, y, 'Z', pieceMappings['Z'][1]);
                break;
            case 'T':
                testMinoPositions = getMinoPositions(field, height, x - 1, y, 'T', pieceMappings['T'][1]);
                if (testMinoPositions.length != TETROMINO)
                    testMinoPositions = getMinoPositions(field, height, x - 1, y, 'T', pieceMappings['T'][2]); // different rotation
                break;
        }
        if (testMinoPositions.length == TETROMINO)
            return { x: x - 1, y: y }; // if T, L (facing down), Z hanging from left
    }
    // at the end of the line
    if (rightMostPos.x == 9) {
        return { x: 0, y: y + 1 };
    }
    return { x: rightMostPos.x + 1, y: y };
}
function getMinoPositions(field, height, x, y, piece, rotationState, visualizeArr) {
    if (visualizeArr === void 0) { visualizeArr = null; }
    var minoPositions = [];
    // empty the field of all colored minos
    var visualizeField = null;
    if (visualizeArr !== null) {
        // create fumen of trying to put piece there
        visualizeField = makeEmptyField(field, height);
    }
    // for each position of a mino from rotation state
    for (var _i = 0, rotationState_1 = rotationState; _i < rotationState_1.length; _i++) {
        var pos = rotationState_1[_i];
        var px = x + pos[0];
        var py = y + pos[1];
        if (isInside(height, px, py)) {
            // add piece mino to field to visualize what it tried
            if (visualizeField !== null) {
                visualizeField.set(px, py, piece);
            }
            // mino matches the piece
            if (field.at(px, py) === piece) {
                minoPositions.push({ x: px, y: py });
                // if not trying to visualize then failed to place
            }
            else if (visualizeField === null) {
                break;
            }
        }
    }
    // add page of it trying this piece and rotation
    if (visualizeField !== null && visualizeArr !== null) {
        visualizeArr.push({ field: visualizeField });
    }
    return minoPositions;
}
function duplicateGlue(subArr, arrays) {
    // check if duplicate
    // new array without y but keep absolute y
    var absSubArr = subArr.map(function (x) { return x >> 5; });
    var arrSet = new Set(absSubArr);
    for (var _i = 0, arrays_1 = arrays; _i < arrays_1.length; _i++) {
        var arr = arrays_1[_i];
        if (subArr.length !== arr.length) {
            return false;
        }
        // check if two arrays are permutations
        var absArr = arr.map(function (x) { return x >> 5; });
        if (absArr.every(function (x) { return arrSet.has(x); })) {
            return true;
        }
    }
    return false;
}
function glue(x0, y0, field, height, piecesArr, allPiecesArr, totalLinesCleared, visualizeArr, expectedSolutions, visualize, order) {
    // scan through board for any colored minos
    for (var y = y0; y < height; y++) {
        for (var x = (y == y0) ? x0 : 0; x < WIDTH; x++) {
            // if it is a piece
            var piece = field.at(x, y);
            if (!"TILJSZO".includes(piece))
                continue;
            // if specify order and the piece isn't the next possible piece in order
            if (order !== null && piece !== order[0])
                continue;
            // if highest level and not I
            if (y == height - 1 && piece != 'I')
                continue;
            // checking if one of the rotations works
            var rotationStates = pieceMappings[piece];
            for (var state = 0; state < rotationStates.length; state++) {
                var newPiecesArr = __spreadArray([], piecesArr, true);
                var minoPositions = getMinoPositions(field, height, x, y, piece, rotationStates[state], (visualize) ? visualizeArr : null);
                // if there's less than minos
                if (minoPositions.length < TETROMINO || isFloating(field, minoPositions)) {
                    continue;
                }
                // place piece
                var newField = field.copy();
                placePiece(newField, minoPositions);
                // clear lines
                var thisLinesCleared = void 0;
                var data = removeLineClears(newField, height);
                newField = data.field;
                thisLinesCleared = data.linesCleared;
                // determine the absolute position of the piece
                var absY = centerMino(minoPositions).y;
                for (var i = 0; i < totalLinesCleared.length && totalLinesCleared[i] <= absY; i++) {
                    absY++;
                }
                // check if a line clear occurred
                var startPos = { x: 0, y: 0 };
                var newTotalLinesCleared = __spreadArray([], totalLinesCleared, true);
                if (thisLinesCleared.length > 0) {
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
                else if (order === null) {
                    startPos = getNewStart(field, height, x, y, minoPositions);
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
                glue(startPos.x, startPos.y, newField, height - thisLinesCleared.length, newPiecesArr, allPiecesArr, newTotalLinesCleared, visualizeArr, expectedSolutions, visualize, order ? order === null || order === void 0 ? void 0 : order.slice(1) : null);
                if (expectedSolutions > 0 && allPiecesArr.length == expectedSolutions) {
                    return;
                }
                // continue on with possiblity another piece could be placed instead of this one
            }
        }
    }
    // if the field doesn't have any more pieces it's good
    if (!anyColoredMinos(field, height) && !duplicateGlue(piecesArr, allPiecesArr)) {
        allPiecesArr.push(piecesArr);
    }
}
function glueFumen(customInput, expectedSolutions, visualize, order) {
    if (expectedSolutions === void 0) { expectedSolutions = -1; }
    if (visualize === void 0) { visualize = false; }
    if (order === void 0) { order = null; }
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
            var height = getHeight(field);
            var emptyField = makeEmptyField(field, height);
            var allPiecesArr = [];
            // try to glue this field and put into all pieces arr
            if (checkGlueable(field, height)) {
                glue(0, 0, field, height, [], allPiecesArr, [], visualizeArr, expectedSolutions, visualize, order);
            }
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
