const {decoder, encoder, Field} = require('tetris-fumen');

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
    var lines = field.str().split("\n");
    for(let i = lines.length-1; i >= 0; i--){
        if(lines[i].match(/X{10}/)){
            lines.splice(i, 1);
        }
    }
    const newField = Field.create(lines.slice(0, -1).join(""), lines[-1]);
    return newField;
}

function checkRotation(x, y, field, piecesArr, allPiecesArr, removeLineClearBool, visualizeArr, depth=0){
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

            // a rotation that works
            let operPiece = {
                type: piece,
                rotation: rotationDict[state],
                x: minoPositions[0][0],
                y: minoPositions[0][1]
            }
            newPiecesArr.push(operPiece)

            let newField = field.copy()
            placePiece(newField, minoPositions);

            let oldHeight = height(newField);
            if(removeLineClearBool){
                newField = removeLineClears(newField);
            }


            // check if a line clear occurred
            let startx = x;
            let starty = y;
            if(oldHeight > height(newField)){
                // start position to 0 otherwise it's where we left off scanning the field
                startx = 0;
                starty = 0;
            }

            let oldLen = allPiecesArr.length;

            let possPiecesArr = scanField(
              startx, 
              starty, 
              newField, 
              newPiecesArr, 
              allPiecesArr, 
              removeLineClearBool, 
              visualizeArr, 
              depth + 1
            )

            leftoverPieces = findRemainingPieces(newField)
            
            // if the field doesn't have any more pieces it's good
            if(possPiecesArr != null && leftoverPieces.length == 0){
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
function scanField(x0, y0, field, piecesArr, allPiecesArr, removeLineClearBool, visualizeArr, depth=0){
    const fieldHeight = height(field);
    for(let y = y0; y < fieldHeight; y++){
        for(let x = (y == y0) ? x0 : 0; x < width; x++){
            // if it is a piece
            if(field.at(x, y).match(/[TILJSZO]/)){
                checkRotation(x, y, field, piecesArr, allPiecesArr, removeLineClearBool, visualizeArr, depth)
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

function glueFumen(customInput=process.argv.slice(2), removeLineClearBool=true, visualize=false){
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

            scanField(0, 0, field, [], allPiecesArr, removeLineClearBool, visualizeArr);
            
            if(allPiecesArr.length == 0){
                console.log(code + " couldn't be glued");
                fumenIssues++;
            }
            
            for(let piecesArr of allPiecesArr){
                let pages = [];
                pages.push({
                    field: emptyField,
                    operation: piecesArr[0]
                })
                for(let i = 1; i < piecesArr.length; i++){
                    pages.push({
                        operation: piecesArr[i]
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
    allFumens = glueFumen("v115@fgi0G8whi0F8whi0F8whi0F8whi0F8h0H8i0G8JeAg?WGAqPNPCq/AAA", true, false);
    console.log(allFumens.join("\n"));
}
