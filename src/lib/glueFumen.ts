import {decoder, encoder, Field, Page, Pages} from 'tetris-fumen';
import {Pos,
        Operation,
        PieceType,
        parsePiece, 
        parsePieceName, 
        Rotation,
        parseRotation, 
        parseRotationName} from './defines';

const HEIGHT = 20;
const WIDTH = 10;
const TETROMINO = 4;

const pieceMappings = {
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
}

// an Operation with also an absolute y value
interface absoluteOperation extends Operation {
    absY: number
}

type encodedOperation = number;

interface removeLineClearsRet {
    field: Field,
    linesCleared: number[],
}

function getHeight(field: Field): number {
    // accounting for newlines and no trailing newline and garbage line
    for (let y = HEIGHT - 1; y >= 0; y--) {
        for (let x = 0; x < WIDTH; x++) {
            if ("TILJSZOX".includes(field.at(x, y))) {
                return y + 1;
            }
        }
    }
    return 0;
}

function isInside(height: number, x: number, y: number): boolean {
    return (0 <= x && x < WIDTH) && (0 <= y && y < height);
}

function isFloating(field: Field, minoPositions: Pos[]): boolean {
    // if there's a 'X' under any of the minos
    return minoPositions.every(pos =>
        // not on floor
        pos.y != 0 && field.at(pos.x, pos.y - 1) != 'X'
    );
}

function centerMino(minoPositions: Pos[]): Pos {
    return minoPositions[0];
}

function placePiece(field: Field, minoPositions: Pos[], piece: PieceType = 'X'): void {
    for (let pos of minoPositions){
        field.set(pos.x, pos.y, piece)
    }
}

function removeLineClears(field: Field, height: number): removeLineClearsRet {
    // line clearing is done internally by tetris-fumen in PlayField
    // but here we want to only clear rows that are all `X`s

    // to avoid serializing the field, we directly alter the field
    let newField = field.copy();
    let currentRow = 0;
    let sourceRow = 0;
    let linesCleared = [];

    while (sourceRow < height) {
        let greyRow = true;
        for (let x = 0; x < WIDTH; x++) {
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
        } else {
            // only need to copy from sourceRow when the rows are different
            if (currentRow != sourceRow) {
                // copy from source to current
                for (let x = 0; x < WIDTH; x++) {
                    newField.set(x, currentRow, newField.at(x, sourceRow))
                }
            }
            // move to the next row above
            currentRow++;
            sourceRow++;
        }
    }
    // blank out remaining rows
    for (let y = currentRow + 1; y < height; y++) {
        for (let x = 0; x < WIDTH; x++) {
            newField.set(x, y, "_");
        }
    }

    return {
        field: newField,
        linesCleared: linesCleared // relative line clear positions ex: [0, 0] (bottommost two lines)
    };
}
// encode operations for faster comparisons
function encodeOp(operation: absoluteOperation): encodedOperation {
    // encode into 15 bit
    // type has 9 possible (4 bits)
    // rotation has 4 possible (2 bits)
    // x has WIDTH (10) possible (4 bits)
    // absY has height (20) possible (5 bits)
    // y has height (20) possible (5 bits)
    let ct = parsePiece(operation.type);
    ct = (ct << 2) + parseRotation(operation.rotation);
    ct = (ct << 4) + operation.x;
    ct = (ct << 5) + operation.absY;
    ct = (ct << 5) + operation.y;
    return ct
}

function decodeOp(ct: number): Operation {
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
    } as Operation
}

function anyColoredMinos(field: Field, height: number): boolean {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < WIDTH; x++) {
            if ("TILJSZO".includes(field.at(x, y))) {
                return true;
            }
        }
    }
    return false;
}

function makeEmptyField(field: Field, height: number): Field{
    let emptyField = field.copy();
    for(let y = 0; y < height; y++){
        for (let x = 0; x < WIDTH; x++) {
            let piece = emptyField.at(x, y);
            if ("TILJSZO".includes(piece)) {
                emptyField.set(x, y, "_");
            }
        }
    }
    return emptyField;
}

function checkGlueable(field: Field, height: number): boolean{
    // check if there's enough minos of each color to place pieces
    const frequencyCounter: Record<string, number> = {};

    for (let y = 0; y < height; y++) {
        for(let x = 0; x < WIDTH; x++) {
            let char = field.at(x, y)
            frequencyCounter[char] = (frequencyCounter[char] || 0) + 1;
        }
    }

    for (const char in frequencyCounter){
        if("TILJSZO".includes(char)){
            if(frequencyCounter[char] % TETROMINO != 0){
                return false;
            }
        }
    }
    return true;
}

function checkWouldFloatPiece(field: Field, y: number, minoPositions: Pos[]): boolean {
    // check if this piece would be floating without the piece under it
    if(y === 0){
        return false
    }

    // check if there's X's all the way to the floor
    const XHeights: Set<number> = new Set<number>();

    for (let pos of minoPositions) {
        for (let newY = pos.y - 1; newY >= 0; newY--) {
            if(field.at(pos.x, newY) === 'X'){
                XHeights.add(newY)
            }
        } 

        let found = true;
        for (let checkY = 0; checkY < y; checkY++) {
            if(!XHeights.has(checkY)) {
                found = false;
                break;
            }
        }
        if(found) {
            return false;
        }
    }

    return true
}

function getNewStart(field: Field, height: number, x: number, y: number, minoPositions: Pos[]): Pos {
    // get new start with several checks if a piece is hanging or not
    // also check if maybe need to clear the lines below it

    if (checkWouldFloatPiece(field, y, minoPositions)) {
        // starting as far down to possibly get this line below to clear
        return {x: 0, y: Math.max(y - 4, 0)}
    }

    // get right most mino in current y
    const rightMostPos: Pos = minoPositions.reduce((maxPos, currentPos) => {
        return currentPos.x > maxPos.x && y == currentPos.y ? currentPos : maxPos;
        }, minoPositions[0]); // Initialize with the first pair

    let testMinoPositions: Pos[] = [];

    if(x > 0 && y > 0 && field.at(x - 1, y - 1) == 'J' && field.at(x, y + 1) == 'J') {
        testMinoPositions = getMinoPositions(field, height, x - 1, y - 1, 'J', pieceMappings['J'][1])
        if(testMinoPositions.length == TETROMINO){
            return {x: x - 1, y: y - 1}; // if J hanging from left
        }
    }
    if(y > 0 && field.at(rightMostPos.x + 1, rightMostPos.y - 1) == 'L' && field.at(rightMostPos.x, rightMostPos.y + 1) == 'L'){
        let testMinoPositions = getMinoPositions(field, height, rightMostPos.x + 1, rightMostPos.y - 1, 'L', pieceMappings['L'][3])
        if(testMinoPositions.length == TETROMINO){
            return {x: rightMostPos.x + 1, y: rightMostPos.y - 1}; // if L hanging from right
        }
    }
    if(x >= 2 && y > 0 && "LS".includes(field.at(x - 2, y)) && "LS".includes(field.at(x, y + 1))){
        switch(field.at(x - 2, y)){
            case 'L':
                testMinoPositions = getMinoPositions(field, height, x - 2, y, 'L', pieceMappings['L'][2])
                break;
            case 'S':
                testMinoPositions = getMinoPositions(field, height, x - 2, y, 'S', pieceMappings['S'][0])
                break;
        }
        if(testMinoPositions.length == TETROMINO)
            return {x: x - 2, y: y}; // if L or S hanging from the left
    }
    if(x >= 1 && y > 0 && "TLZ".includes(field.at(x - 1, y)) && "TLZ".includes(field.at(x, y + 1))){
        switch(field.at(x - 1, y)){
            case 'L':
                testMinoPositions = getMinoPositions(field, height, x - 1, y, 'L', pieceMappings['L'][2])
                break;
            case 'Z':
                testMinoPositions = getMinoPositions(field, height, x - 1, y, 'Z', pieceMappings['Z'][1])
                break;
            case 'T':
                testMinoPositions = getMinoPositions(field, height, x - 1, y, 'T', pieceMappings['T'][1])
                if(testMinoPositions.length != TETROMINO)
                    testMinoPositions = getMinoPositions(field, height, x - 1, y, 'T', pieceMappings['T'][2]) // different rotation
                break;
        }
        if(testMinoPositions.length == TETROMINO)
            return {x: x - 1, y: y}; // if T, L (facing down), Z hanging from left
    }

    // at the end of the line
    if (rightMostPos.x == 9) {
        return {x: 0, y: y + 1}
    }

    return {x: rightMostPos.x + 1, y: y};
}

function getMinoPositions(
    field: Field, 
    height: number,
    x: number, 
    y: number, 
    piece: PieceType,
		rotationState: number[][],
		visualizeArr: Pages | null = null): Pos[]
{
		let minoPositions: Pos[] = [];

    // empty the field of all colored minos
    let visualizeField: Field | null = null;
    if(visualizeArr !== null) {
        // create fumen of trying to put piece there
        visualizeField = makeEmptyField(field, height)
    }

    // for each position of a mino from rotation state
    for(let pos of rotationState){
        let px = x + pos[0];
        let py = y + pos[1];
        
        if(isInside(height, px, py)) {
            // add piece mino to field to visualize what it tried
            if(visualizeField !== null){
                visualizeField.set(px, py, piece);
            }

            // mino matches the piece
            if(field.at(px, py) === piece) {
                minoPositions.push({x: px, y: py} as Pos);
            // if not trying to visualize then failed to place
            } else if (visualizeField === null) {
                break
            }
        }
    }
    
    // add page of it trying this piece and rotation
    if(visualizeField !== null && visualizeArr !== null){
        visualizeArr.push({field: visualizeField} as Page);
    }

    return minoPositions;
}

function duplicateGlue(subArr: encodedOperation[], arrays: encodedOperation[][]): boolean {
    // check if duplicate

    // new array without y but keep absolute y
    let absSubArr = subArr.map((x: number) => x >> 5);
    const arrSet: Set<encodedOperation> = new Set<encodedOperation>(absSubArr);

    for(let arr of arrays) {
        if (subArr.length !== arr.length) {
            return false;
        }

        // check if two arrays are permutations
        let absArr = arr.map((x: number) => x >> 5);
        if(absArr.every((x) => arrSet.has(x))) {
            return true;
        }
    }

    return false;
}

function glue(
    x0: number,
    y0: number, 
    field: Field, 
    height: number,
    piecesArr: encodedOperation[], 
    allPiecesArr: encodedOperation[][],
    totalLinesCleared: number[], 
    visualizeArr: Pages, 
    expectedSolutions: number,
    visualize: boolean): void 
{
    // scan through board for any colored minos
    for(let y = y0; y < height; y++){
        for(let x = (y == y0) ? x0 : 0; x < WIDTH; x++){
            // if it is a piece
            let piece = field.at(x, y);

            if(!"TILJSZO".includes(piece))
                continue;

            // if highest level and not I
            if(y == height - 1 && piece != 'I'){
                continue;
            }

            // checking if one of the rotations works
            const rotationStates = pieceMappings[piece];
            for(let state: Rotation = 0; state < rotationStates.length; state++){
                let newPiecesArr = [...piecesArr];

                let minoPositions: Pos[] = getMinoPositions(
                    field, height, x, y, piece, rotationStates[state],(visualize) ? visualizeArr : null
                );

                // if there's less than minos
                if(minoPositions.length < TETROMINO || isFloating(field, minoPositions)){
                    continue
                }

                // place piece
                let newField = field.copy()
                placePiece(newField, minoPositions);

                // clear lines
                let thisLinesCleared: number[];
                let data = removeLineClears(newField, height);
                newField = data.field;
                thisLinesCleared = data.linesCleared;

                // determine the absolute position of the piece
                let absY = centerMino(minoPositions).y;
                for(let i = 0; i < totalLinesCleared.length && totalLinesCleared[i] <= absY; i++) {
                    absY++;
                }

                // check if a line clear occurred
                let startPos: Pos = {x: 0, y: 0};
                let newTotalLinesCleared: number[] = [...totalLinesCleared];
                if(thisLinesCleared.length > 0){
                    // determine the absolute position of the line numbers
                    for(let lineNum of thisLinesCleared) {
                        let i: number;
                        for(i = 0; i < newTotalLinesCleared.length && newTotalLinesCleared[i] <= lineNum; i++){
                            lineNum++;
                        }
                        newTotalLinesCleared.splice(i, 0, lineNum);
                    }
                } else {
                    startPos = getNewStart(field, height, x, y, minoPositions)
                }

                // a rotation that works
                let operPiece = {
                    type: piece,
                    rotation: parseRotationName(state),
                    x: centerMino(minoPositions).x,
                    y: centerMino(minoPositions).y,
                    absY: absY,
                }
                newPiecesArr.push(encodeOp(operPiece))

                glue(startPos.x, startPos.y, newField, height - thisLinesCleared.length, newPiecesArr, allPiecesArr, newTotalLinesCleared, visualizeArr, expectedSolutions, visualize);

                if(expectedSolutions > 0 && allPiecesArr.length == expectedSolutions){
                    return;
                }

                // continue on with possiblity another piece could be placed instead of this one
            }
        }
    }

    // if the field doesn't have any more pieces it's good
    if(!anyColoredMinos(field, height) && !duplicateGlue(piecesArr, allPiecesArr)){
        allPiecesArr.push(piecesArr);
    }
}

export default function glueFumen(customInput: string | string[], expectedSolutions: number = -1, visualize: boolean = false){
    let inputFumenCodes: string[] = [];

    if(!Array.isArray(customInput)){
        customInput = [customInput];
    }

    for(let rawInput of customInput){
        inputFumenCodes.push(...rawInput.split(/\s/));
    }

    // all "global" variables
    let allFumens: string[] = [];
    let visualizeArr: Pages = [];
    let fumenIssues = 0;

    // for each fumen
    for(let code of inputFumenCodes){
        let inputPages: Pages = decoder.decode(code);
        let thisGlueFumens: string[] = []; // holds the glue fumens for this fumenCode

        // glue each page
        for(let page of inputPages){
            let field: Field = page.field;
            let height: number = getHeight(field);
            let emptyField: Field = makeEmptyField(field, height);
            let allPiecesArr: encodedOperation[][] = [];

            // try to glue this field and put into all pieces arr
            if(checkGlueable(field, height)){
                glue(0, 0, field, height, [], allPiecesArr, [], visualizeArr, expectedSolutions, visualize);
            }
            
            // couldn't glue
            if(allPiecesArr.length == 0){
                console.log(code + " couldn't be glued");
                fumenIssues++;
            }
            
            // each sequence of pieces
            for(let piecesArr of allPiecesArr){
                let pages: Pages = [];
                pages.push({
                    field: emptyField,
                    operation: decodeOp(piecesArr[0])
                } as Page)
                for(let i = 1; i < piecesArr.length; i++){
                    pages.push({
                        operation: decodeOp(piecesArr[i])
                    } as Page)
                }

                // add the final glue fumens to visualization
                if(visualize)
                    visualizeArr.push(...pages);

                // the glued fumen for this inputted page
                let pieceFumen: string = encoder.encode(pages);
                thisGlueFumens.push(pieceFumen);
            }

            // multiple fumens from one page
            if(allPiecesArr.length > 1){
                // multiple outputs warning
                allFumens.push("Warning: " + code + " led to " + allPiecesArr.length + " outputs");
            }
        }

        // add the glue fumens for this code to all the fumens
        allFumens.push(...thisGlueFumens)
    }
    if(inputFumenCodes.length > allFumens.length){
        console.log("Warning: " + fumenIssues + " fumens couldn't be glued");
    }

    // output visualization instead of glued fumens
    if(visualize)
        return [encoder.encode(visualizeArr)];

    // output glued fumens
    return allFumens
}
