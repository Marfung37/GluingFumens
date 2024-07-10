const {decoder, encoder, Field} = require('tetris-fumen');
const {parseRotationName, 
      parseRotation, 
      parsePieceName,
      parsePiece} = require('./node_modules/tetris-fumen/lib/defines');

const width = 10;

const pieceMappings = {
    "T": [
        [[1, 0], [0, 0], [1, 1], [2, 0]],
        [[0, 1], [0, 0], [-1, 1], [0, 2]],
        [[0, 1], [0, 0], [-1, 1], [1, 1]],
        [[0, 1], [0, 0], [1, 1], [0, 2]],
        ],
    "I": [
        [[1, 0], [0, 0], [2, 0], [3, 0]],
        [[0, 1], [0, 0], [0, 2], [0, 3]],
        ],
    "L": [
        [[1, 0], [0, 0], [2, 0], [2, 1]],
        [[0, 1], [0, 0], [0, 2], [-1, 2]],
        [[1, 1], [0, 0], [0, 1], [2, 1]],
        [[0, 1], [0, 0], [1, 0], [0, 2]],
        ],
    "J": [
        [[1, 0], [0, 0], [0, 1], [2, 0]],
        [[1, 1], [0, 0], [1, 0], [1, 2]],
        [[-1, 1], [0, 0], [-2, 1], [0, 1]],
        [[0, 1], [0, 0], [0, 2], [1, 2]]
        ],
    "S": [
        [[1, 0], [0, 0], [1, 1], [2, 1]],
        [[0, 1], [0, 0], [-1, 1], [-1, 2]]
        ],
    "Z": [
        [[0, 0], [1, 0], [-1, 1], [0, 1]],
        [[1, 1], [0, 0], [0, 1], [1, 2]]
        ],
    "O": [
        [[0, 0], [1, 0], [0, 1], [1, 1]]
        ]
}

const rotationDict = {
    0: "spawn",
    1: "left",
    2: "reverse",
    3: "right"
}

function height(field){
    // accounting for newlines and no trailing newline and garbage line
    return ((field.str().length + 1) / (width + 1) - 1);
}

function isInside(field, x, y){
    return 0 <= x && x < width && 0 <= y < height(field);
}

function placePiece(field, minoPositions){
    for (let [x, y] of minoPositions){
        field.set(x, y, "X")
    }
}

function findRemainingPieces(field){
    let lines = field.str().split("\n").slice(0, -1);
    let piecesFound = [];
    for(let line of lines){
        let pieces = line.match(/[TILJSZO]/g)
        if(pieces != null){
            for(let piece of pieces){
                if(!piecesFound.includes(piece)){
                    piecesFound.push(piece);
                }
            }
            
        }
    }
    return piecesFound;
}

function removeLineClears(field){
    let lines = field.str().split("\n").slice(0, -1);
    let linesCleared = [];
    for(let i = lines.length-1; i >= 0; i--){
        if(lines[i].match(/X{10}/)){
            lines.splice(i, 1);
            linesCleared.push(lines.length - i);
        }
    }
    const newField = Field.create(lines.join(""));
    return {
      field: newField, 
      linesCleared: linesCleared
    };
}
// encode operations for faster comparisons
function encodeOp(operation) {
    // encode into 15 bit
    // type has 9 possible (4 bits)
    // rotation has 4 possible (2 bits)
    // x has width (10) possible (4 bits)
    // absY has height (20) possible (5 bits)
    // y has height (20) possible (5 bits)
    let ct = parsePiece(operation.type);
    ct = (ct << 2) + parseRotation(operation.rotation);
    ct = (ct << 4) + operation.x;
    ct = (ct << 5) + operation.absY;
    ct = (ct << 5) + operation.y;
    return ct
}

function decodeOp(ct) {
    let y = ct & 0x1F; ct >>= 5;
    ct >>= 5; // remove the absolute Y position
    let x = ct & 0xF; ct >>= 4;
    let rotation = parseRotationName(ct & 0x3); ct >>= 2;
    let type = parsePieceName(ct)

    return {
        type: type,
        rotation: rotation,
        x: x,
        y: y
    }
}

function eqPermutatation (arr1, arr2) {
    if (arr1.size !== arr2.size)
        return false;
    
    arrSet = new Set(arr2);

    return arr1.every((x) => arrSet.has(x));
}

function checkRotation(x, y, field, piecesArr, allPiecesArr, totalLinesCleared, visualizeArr, depth=0){
    const piece = field.at(x, y);

    const rotationStates = pieceMappings[piece];

    let found = false;
    let leftoverPieces = null;

    for(let state = 0; state < rotationStates.length; state++){
        let minoPositions = [];
        let newPiecesArr = piecesArr.slice();

        // create fumen of trying to put piece there
        let visualizeField = makeEmptyField(field)
        for(let pos of rotationStates[state]){
            let px = x + pos[0];
            let py = y + pos[1];
            
            if(isInside(field, px, py)) {
                visualizeField.set(px, py, piece);
                if(field.at(px, py) == piece) {
                    minoPositions.push([px, py])
                }
            }
        }
        visualizeArr.push({field: visualizeField});

        // if there's 4 minos
        if(minoPositions.length == 4){
            // a rotation is found
            let foundBefore = found;
            found = true;

            let newField = field.copy()
            placePiece(newField, minoPositions);

            let linesCleared;
            let data = removeLineClears(newField);
            newField = data.field;
            linesCleared = data.linesCleared;

            // determine the absolute position of the piece
            let absY = minoPositions[0][1];
            for(let i = 0; i < totalLinesCleared.length && totalLinesCleared[i] < absY; i++) {
                absY++;
            }

            // check if a line clear occurred
            let startx = x;
            let starty = y;
            let newTotalLinesCleared = [...totalLinesCleared];
            if(linesCleared.length > 0){
                // start position to 0 otherwise it's where we left off scanning the field
                startx = 0;
                starty = 0;

                // determine the absolute position of the line numbers
                for(let lineNum of linesCleared) {
                    let i;
                    for(i = 0; i < newTotalLinesCleared.length && newTotalLinesCleared[i] <= lineNum; i++){
                        lineNum++;
                    }
                    newTotalLinesCleared.splice(i, 0, lineNum);
                }

            }

            // a rotation that works
            let operPiece = {
                type: piece,
                rotation: rotationDict[state],
                x: minoPositions[0][0],
                y: minoPositions[0][1],
                absY: absY,
            }
            newPiecesArr.push(encodeOp(operPiece))

            let oldLen = allPiecesArr.length;

            let possPiecesArr = scanField(
              startx, 
              starty, 
              newField, 
              newPiecesArr, 
              allPiecesArr, 
              newTotalLinesCleared,
              visualizeArr, 
              depth + 1
            )

            leftoverPieces = findRemainingPieces(newField)
            
            // if the field doesn't have any more pieces it's good
            if(possPiecesArr != null && leftoverPieces.length == 0){
                // check if duplicate
                let duplicate = false;
                // new array without y but keep absolute y
                let absPossPiecesArr = possPiecesArr.map((x) => x >> 5);
                
                for(let arr of allPiecesArr) {
                    let absArr = arr.map((x) => x >> 5);
                    if(eqPermutatation(absArr, absPossPiecesArr)){
                        duplicate = true;
                        break;
                    }
                }
                if(!duplicate)
                    allPiecesArr.push(possPiecesArr);

            } else if(oldLen == allPiecesArr.length){
                // the piece didn't result into a correct glued fumen
                if(!leftoverPieces.includes(piece)){
                    return leftoverPieces
                } else {
                    found = foundBefore
                }
            }
        }
    }
    return found
}

// scan until find next colored mino to run checkRotation on it
function scanField(x0, y0, field, piecesArr, allPiecesArr, totalLinesCleared, visualizeArr, depth=0){
    const fieldHeight = height(field);
    for(let y = y0; y < fieldHeight; y++){
        for(let x = (y == y0) ? x0 : 0; x < width; x++){
            // if it is a piece
            if(field.at(x, y).match(/[TILJSZO]/)){
                checkRotation(x, y, field, piecesArr, allPiecesArr, [...totalLinesCleared], visualizeArr, depth)
                // continue on with possiblity this is piece is cut
            }
        }
    }
    return piecesArr;
}

function makeEmptyField(field){
    var emptyField = field.copy();
    const fieldHeight = height(field);
    for(let y = 0; y < fieldHeight; y++){
        for(let x = 0; x < width; x++){
            let piece = emptyField.at(x, y);
            if(piece.match(/[TILJSZO]/)){
                emptyField.set(x, y, "_");
            }
        }
    }
    return emptyField;
}

function glueFumen(customInput=process.argv.slice(2), visualize=false){
    var fumenCodes = [];

    if(!Array.isArray(customInput)){
        customInput = [customInput];
    }

    for(let rawInput of customInput){
        fumenCodes.push(...rawInput.split(/\s/));
    }

    var allPiecesArr = [];
    var allFumens = [];
    var visualizeArr = [];
    var fumenIssues = 0;
    for(let code of fumenCodes){
        let inputPages = decoder.decode(code);
        let thisGlueFumens = []; // holds the glue fumens for this fumenCode
        for(let pageNum = 0; pageNum < inputPages.length; pageNum++){
            let field = inputPages[pageNum].field;
            let emptyField = makeEmptyField(field, height);
            allPiecesArr = []

            scanField(0, 0, field, [], allPiecesArr, [], visualizeArr);
            
            if(allPiecesArr.length == 0){
                console.log(code + " couldn't be glued");
                fumenIssues++;
            }
            
            for(let piecesArr of allPiecesArr){
                let pages = [];
                pages.push({
                    field: emptyField,
                    operation: decodeOp(piecesArr[0])
                })
                for(let i = 1; i < piecesArr.length; i++){
                    pages.push({
                        operation: decodeOp(piecesArr[i])
                    })
                }
                if(visualize)
                    visualizeArr.push(...pages);
                let pieceFumen = encoder.encode(pages);
                thisGlueFumens.push(pieceFumen);
            }

            if(allPiecesArr.length > 1){
                // multiple outputs warning
                allFumens.push("Warning: " + code + " led to " + allPiecesArr.length + " outputs");
            }
        }

        // add the glue fumens for this code to all the fumens
        allFumens.push(...thisGlueFumens)
    }
    if(fumenCodes.length > allFumens.length){
        console.log("Warning: " + fumenIssues + " fumens couldn't be glued");
    }

    if(visualize)
        return [encoder.encode(visualizeArr)];

    return allFumens
}

exports.glueFumen = glueFumen;

if(require.main == module){
    allFumens = glueFumen('v115@fgi0G8whi0F8whi0F8whi0F8whi0F8h0H8i0G8JeAg?WGAqPNPCq/AAA');
    console.log(allFumens.join("\n"));
}
