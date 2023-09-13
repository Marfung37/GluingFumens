const {decoder, encoder, Field} = require('tetris-fumen');

const rowLen = 10;

const pieceMappings = {
    "T": [
        [[0, -1], [0, 0], [-1, -1], [1, -1]],
        [[0, -1], [0, 0], [-1, -1], [0, -2]],
        [[1, 0], [0, 0], [2, 0], [1, -1]],
        [[0, -1], [0, 0], [1, -1], [0, -2]]
        ],
    "I": [
        [[1, 0], [0, 0], [2, 0], [3, 0]],
        [[0, -2], [0, 0], [0, -1], [0, -3]]
        ],
    "L": [
        [[-1, -1], [0, 0], [-2, -1], [0, -1]],
        [[1, -1], [0, 0], [1, 0], [1, -2]],
        [[1, 0], [0, 0], [2, 0], [0, -1]],
        [[0, -1], [0, 0], [0, -2], [1, -2]]
        ],
    "J": [
        [[1, -1], [0, 0], [0, -1], [2, -1]],
        [[0, -1], [0, 0], [-1, -2], [0, -2]],
        [[1, 0], [0, 0], [2, 0], [2, -1]],
        [[0, -1], [0, 0], [1, 0], [0, -2]]
        ],
    "S": [
        [[0, -1], [0, 0], [1, 0], [-1, -1]],
        [[1, -1], [0, 0], [0, -1], [1, -2]]
        ],
    "Z": [
        [[1, -1], [0, 0], [1, 0], [2, -1]],
        [[0, -1], [0, 0], [-1, -1], [-1, -2]]
        ],
    "O": [
        [[0, -1], [0, 0], [1, 0], [1, -1]]
        ]
}

const rotationDict = {
    0: "spawn",
    1: "left",
    2: "reverse",
    3: "right"
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
        let grayFieldStr = "";
        for(let mino of field.str().split("\n").slice(0, -1).join("")){
            if(mino == "X"){
                grayFieldStr += "X";
            } else {
                grayFieldStr += "_";
            }
        }
        let grayField = Field.create(grayFieldStr);
        grayField.fill({
                type: piece,
                rotation: rotationDict[state],
                x: x + rotationStates[state][0][0],
                y: y + rotationStates[state][0][1]
            }, true);

        grayField = Field.create(grayField.str().split("\n").slice(-(y + 2), -1).join("")); // get only 4 lines

        visualizeArr.push({field: grayField});

        for(let pos of rotationStates[state]){
            let posX = x + pos[0];
            let posY = y + pos[1];
            // checks for position is in bounds
            if(posX < 0 || posX >= rowLen){
                break;
            }
            if(posY < 0){
                break;
            }

            if(field.at(posX, posY) == piece){
                minoPositions.push([posX, posY]);
            }
            else{
                break;
            }
        }
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
            for(let pos of minoPositions){
                let posX = pos[0];
                let posY = pos[1];
                // change the field to be the piece to be replaced by gray
                newField.set(posX, posY, "X");
            }

            let oldHeight = newField.str().split("\n").length - 1;
            if(removeLineClearBool){
                newField = removeLineClears(newField);
            }
            

            const height = newField.str().split("\n").length - 1;

            // check if a line clear occurred
            let startx = x;
            let starty = y
            if(oldHeight > height){
                // start position to 0 otherwise it's where we left off scanning the field
                startx = 0;
                starty = height - 1
            }

            let oldLen = allPiecesArr.length;

            let data = scanField(startx, starty, newField, newPiecesArr, allPiecesArr, removeLineClearBool, visualizeArr, depth + 1)
            let possPiecesArr = data[0];
            leftoverPieces = data[1];

            if(leftoverPieces == null){
                leftoverPieces = findRemainingPieces(newField)
            }
            
            // if the field doesn't have any more pieces it's good
            if(possPiecesArr != null && leftoverPieces.length == 0){
                allPiecesArr.push(possPiecesArr);
            } else if(oldLen == allPiecesArr.length){
                // the piece didn't result into a correct glued fumen
                if(!leftoverPieces.includes(piece)){
                    return [found, leftoverPieces]
                } else {
                    found = foundBefore
                }
            }
        }
    }
    return [found, leftoverPieces]
}

function scanField(x, y, field, piecesArr, allPiecesArr, removeLineClearBool, visualizeArr, depth=0){
    var newX = x;
    for(let newY = y; newY >= 0; newY--){
        for(; newX < rowLen; newX++){
            // if it is a piece
            if(field.at(newX, newY) != "X" && field.at(newX, newY) != "_"){
                let [rotationWorked, leftover] = checkRotation(newX, newY, field, piecesArr, allPiecesArr, removeLineClearBool, visualizeArr, depth)
                if(rotationWorked){
                    // a rotation works for the piece so just end the function as the scan finished
                    return [null, leftover];
                }
                // skips this one that meets no rotation as it might be a cut piece
            }
        }
        newX = 0
    }
    return [piecesArr, null];
}

function makeEmptyField(field, height){
    var emptyField = field.copy();
    for(let y = height-1; y >= 0; y--){
        for(let x = 0; x < rowLen; x++){
            let piece = emptyField.at(x, y);
            if(piece.match(/[TILJSZO]/)){
                emptyField.set(x, y, "_");
            }
        }
    }
    return emptyField;
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

function glueFumen(customInput=process.argv.slice(2), removeLineClearBool=true, visualize=false){
    var fumenCodes = [];

    if(typeof customInput != 'object'){
        throw new Error("Custom input for glueFumen must be an array")
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
            const height = field.str().split("\n").length - 1;
            let emptyField = makeEmptyField(field, height);
            allPiecesArr = []

            scanField(0, height - 1, field, [], allPiecesArr, removeLineClearBool, visualizeArr);
            
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
                allFumens.push("Warning: " + code + " led to " + allPiecesArr.length + " outputs: " + thisGlueFumens.join(" "));
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
    allFumens = glueFumen();
    console.log(allFumens.join("\n"));
}
