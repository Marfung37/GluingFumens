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
        ]
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

function height(field: Field): number {
    // accounting for newlines and no trailing newline and garbage line
    return ((field.str().length + 1) / (WIDTH + 1) - 1);
}

function isInside(field: Field, x: number, y: number): boolean {
    return (0 <= x && x < WIDTH) && (0 <= y && y < height(field));
}

function isFloating(field: Field, minoPositions: Pos[]): boolean {
    // if there's a 'X' under any of the minos
    for (let pos of minoPositions) {
        // on floor
        if(pos.y == 0 || field.at(pos.x, pos.y - 1) == 'X'){
            return false;
        }
    }

    return true;
}

function centerMino(minoPositions: Pos[]): Pos {
    return minoPositions[0];
}

function placePiece(field: Field, minoPositions: Pos[], piece: PieceType = 'X'): void {
    for (let pos of minoPositions){
        field.set(pos.x, pos.y, piece)
    }
}

function removeLineClears(field: Field): removeLineClearsRet {
    let lines: string[] = field.str().split("\n").slice(0, -1);
    let linesCleared: number[] = [];

    // go through each line to check if just gray minos
    for(let i = lines.length - 1; i >= 0; i--){
        if(lines[i] === "X".repeat(WIDTH)){
            lines.splice(i, 1); // remove line
            linesCleared.push(lines.length - i); // add relative line num that was cleared
        }
    }

    // create new field with the cleared field
    const newField = Field.create(lines.join(""));

    return {
      field: newField, 
      linesCleared: linesCleared // relative line clear positions ex: [0, 0] (first two lines)
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

function anyColoredMinos(field: Field): boolean {
    let lines = field.str().split("\n").slice(0, -1);
    for(let line of lines){
        let pieces = line.match(/[TILJSZO]/g)
        if(pieces != null){
            return true;
        }
    }
    return false;
}

function makeEmptyField(field: Field): Field{
    var emptyField = field.copy();
    const fieldHeight = height(field);
    for(let y = 0; y < fieldHeight; y++){
        for(let x = 0; x < WIDTH; x++){
            let piece = emptyField.at(x, y);
            if(piece.match(/[TILJSZO]/)){
                emptyField.set(x, y, "_");
            }
        }
    }
    return emptyField;
}

function getMinoPositions(
    field: Field, 
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
        visualizeField = makeEmptyField(field)
    }

    // for each position of a mino from rotation state
    for(let pos of rotationState){
        let px = x + pos[0];
        let py = y + pos[1];
        
        if(isInside(field, px, py)) {
            // add piece mino to field to visualize what it tried
            if(visualizeField !== null){
                visualizeField.set(px, py, piece);
            }

            // mino matches the piece
            if(field.at(px, py) === piece) {
                minoPositions.push({x: px, y: py} as Pos);
            }
        }
    }
    
    // add page of it trying this piece and rotation
    if(visualizeField !== null && visualizeArr !== null){
        visualizeArr.push({field: visualizeField} as Page);
    }

    return minoPositions;
}

function duplicateGlue (subArr: encodedOperation[], arrays: encodedOperation[][]): boolean {
    // check if duplicate
    let duplicate = false;

    // new array without y but keep absolute y
    let absSubArr = subArr.map((x: number) => x >> 5);
    const arrSet: Set<encodedOperation> = new Set<encodedOperation>(absSubArr);

    for(let arr of arrays) {
        // check if the two arrays are the same length
        if (subArr.length !== arr.length) {
            duplicate = false;
            break;
        }

        // check if two arrays are permutations
        let absArr = arr.map((x: number) => x >> 5);
        if(absArr.every((x) => arrSet.has(x))) {
            duplicate = true;
            break;
        }
    }

    return duplicate;
}

function glue(
    x0: number, 
    y0: number, 
    field: Field, 
    piecesArr: encodedOperation[], 
    allPiecesArr: encodedOperation[][],
    totalLinesCleared: number[], 
    visualizeArr: Pages, 
    visualize: boolean): void 
{
    const fieldHeight = height(field);

    // scan through board for any colored minos
    for(let y = y0; y < fieldHeight; y++){
        for(let x = (y == y0) ? x0 : 0; x < WIDTH; x++){
            // if it is a piece
            let piece = field.at(x, y);
            if(piece.match(/[TILJSZO]/)){
                // checking if one of the rotations works
                const rotationStates = pieceMappings[piece];
                for(let state: Rotation = 0; state < rotationStates.length; state++){
                    let newPiecesArr = [...piecesArr];

                    let minoPositions = getMinoPositions(
                        field, x, y, piece, rotationStates[state],(visualize) ? visualizeArr : null
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
                    let data = removeLineClears(newField);
                    newField = data.field;
                    thisLinesCleared = data.linesCleared;

                    // determine the absolute position of the piece
                    let absY = centerMino(minoPositions).y;
                    for(let i = 0; i < totalLinesCleared.length && totalLinesCleared[i] < absY; i++) {
                        absY++;
                    }

                    // check if a line clear occurred
                    let startx: number = x;
                    let starty: number = y;
                    let newTotalLinesCleared: number[] = [...totalLinesCleared];
                    if(thisLinesCleared.length > 0){
                        // start position to 0 otherwise it's where we left off scanning the field
                        startx = 0;
                        starty = 0;

                        // determine the absolute position of the line numbers
                        for(let lineNum of thisLinesCleared) {
                            let i: number;
                            for(i = 0; i < newTotalLinesCleared.length && newTotalLinesCleared[i] <= lineNum; i++){
                                lineNum++;
                            }
                            newTotalLinesCleared.splice(i, 0, lineNum);
                        }

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

                    glue(startx, starty, newField, newPiecesArr, allPiecesArr, newTotalLinesCleared, visualizeArr, visualize);

                    // continue on with possiblity another piece could be placed instead of this one
                }
            }
        }
    }

    // if the field doesn't have any more pieces it's good
    if(!anyColoredMinos(field) && !duplicateGlue(piecesArr, allPiecesArr)){
        allPiecesArr.push(piecesArr);
    }
}

export default function glueFumen(customInput: string | string[] = process.argv.slice(2), visualize: boolean = false){
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
            let emptyField: Field = makeEmptyField(field);
            let allPiecesArr: encodedOperation[][] = [];

            // try to glue this field and put into all pieces arr
            glue(0, 0, field, [], allPiecesArr, [], visualizeArr, visualize);
            
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

if(require.main == module) {
    let allFumens = glueFumen();
    console.log(allFumens.join("\n"));
}
