import { test, expect } from "@jest/globals";

import { decoder } from 'tetris-fumen';
import EncodedField from '../src/lib/EncodedField';
import { Mino, Rotation, WIDTH, HEIGHT, pieceMappings } from '../src/lib/defines';
import {
  getOffsets,
  centerMino,
  bottomLeftToCenterMino,
  decodeWrapper,
  isValidPieceChar,
  isMinoPiece,
  inBounds,
  findLineClears,
  clearLines
} from '../src/lib/utils';

describe("utilities", () => {
  test('getOffsets', () => {
    expect.assertions(28);

    expect(getOffsets(Mino.T, Rotation.spawn)).toBe(pieceMappings[Mino.T][Rotation.spawn]);
    expect(getOffsets(Mino.T, Rotation.right)).toBe(pieceMappings[Mino.T][Rotation.right]);
    expect(getOffsets(Mino.T, Rotation.reverse)).toBe(pieceMappings[Mino.T][Rotation.reverse]);
    expect(getOffsets(Mino.T, Rotation.left)).toBe(pieceMappings[Mino.T][Rotation.left]);

    expect(getOffsets(Mino.I, Rotation.spawn)).toBe(pieceMappings[Mino.I][Rotation.spawn]);
    expect(getOffsets(Mino.I, Rotation.right)).toBe(pieceMappings[Mino.I][Rotation.right]);
    expect(getOffsets(Mino.I, Rotation.reverse)).toBe(pieceMappings[Mino.I][Rotation.spawn]);
    expect(getOffsets(Mino.I, Rotation.left)).toBe(pieceMappings[Mino.I][Rotation.right]);

    expect(getOffsets(Mino.L, Rotation.spawn)).toBe(pieceMappings[Mino.L][Rotation.spawn]);
    expect(getOffsets(Mino.L, Rotation.right)).toBe(pieceMappings[Mino.L][Rotation.right]);
    expect(getOffsets(Mino.L, Rotation.reverse)).toBe(pieceMappings[Mino.L][Rotation.reverse]);
    expect(getOffsets(Mino.L, Rotation.left)).toBe(pieceMappings[Mino.L][Rotation.left]);

    expect(getOffsets(Mino.J, Rotation.spawn)).toBe(pieceMappings[Mino.J][Rotation.spawn]);
    expect(getOffsets(Mino.J, Rotation.right)).toBe(pieceMappings[Mino.J][Rotation.right]);
    expect(getOffsets(Mino.J, Rotation.reverse)).toBe(pieceMappings[Mino.J][Rotation.reverse]);
    expect(getOffsets(Mino.J, Rotation.left)).toBe(pieceMappings[Mino.J][Rotation.left]);

    expect(getOffsets(Mino.S, Rotation.spawn)).toBe(pieceMappings[Mino.S][Rotation.spawn]);
    expect(getOffsets(Mino.S, Rotation.right)).toBe(pieceMappings[Mino.S][Rotation.right]);
    expect(getOffsets(Mino.S, Rotation.reverse)).toBe(pieceMappings[Mino.S][Rotation.spawn]);
    expect(getOffsets(Mino.S, Rotation.left)).toBe(pieceMappings[Mino.S][Rotation.right]);

    expect(getOffsets(Mino.Z, Rotation.spawn)).toBe(pieceMappings[Mino.Z][Rotation.spawn]);
    expect(getOffsets(Mino.Z, Rotation.right)).toBe(pieceMappings[Mino.Z][Rotation.right]);
    expect(getOffsets(Mino.Z, Rotation.reverse)).toBe(pieceMappings[Mino.Z][Rotation.spawn]);
    expect(getOffsets(Mino.Z, Rotation.left)).toBe(pieceMappings[Mino.Z][Rotation.right]);

    expect(getOffsets(Mino.O, Rotation.spawn)).toBe(pieceMappings[Mino.O][Rotation.spawn]);
    expect(getOffsets(Mino.O, Rotation.right)).toBe(pieceMappings[Mino.O][Rotation.spawn]);
    expect(getOffsets(Mino.O, Rotation.reverse)).toBe(pieceMappings[Mino.O][Rotation.spawn]);
    expect(getOffsets(Mino.O, Rotation.left)).toBe(pieceMappings[Mino.O][Rotation.spawn]);
  });

  test('centerMino', () => {
    expect.assertions(28);

    expect(centerMino(Mino.T, Rotation.spawn)).toBe(0);
    expect(centerMino(Mino.T, Rotation.right)).toBe(0);
    expect(centerMino(Mino.T, Rotation.reverse)).toBe(0);
    expect(centerMino(Mino.T, Rotation.left)).toBe(0);

    expect(centerMino(Mino.I, Rotation.spawn)).toBe(0);
    expect(centerMino(Mino.I, Rotation.right)).toBe(0);
    expect(centerMino(Mino.I, Rotation.reverse)).toBe(1);
    expect(centerMino(Mino.I, Rotation.left)).toBe(1);

    expect(centerMino(Mino.L, Rotation.spawn)).toBe(0);
    expect(centerMino(Mino.L, Rotation.right)).toBe(0);
    expect(centerMino(Mino.L, Rotation.reverse)).toBe(0);
    expect(centerMino(Mino.L, Rotation.left)).toBe(0);

    expect(centerMino(Mino.J, Rotation.spawn)).toBe(0);
    expect(centerMino(Mino.J, Rotation.right)).toBe(0);
    expect(centerMino(Mino.J, Rotation.reverse)).toBe(0);
    expect(centerMino(Mino.J, Rotation.left)).toBe(0);

    expect(centerMino(Mino.S, Rotation.spawn)).toBe(0);
    expect(centerMino(Mino.S, Rotation.right)).toBe(0);
    expect(centerMino(Mino.S, Rotation.reverse)).toBe(1);
    expect(centerMino(Mino.S, Rotation.left)).toBe(1);

    expect(centerMino(Mino.Z, Rotation.spawn)).toBe(0);
    expect(centerMino(Mino.Z, Rotation.right)).toBe(0);
    expect(centerMino(Mino.Z, Rotation.reverse)).toBe(1);
    expect(centerMino(Mino.Z, Rotation.left)).toBe(1);

    expect(centerMino(Mino.O, Rotation.spawn)).toBe(0);
    expect(centerMino(Mino.O, Rotation.right)).toBe(1);
    expect(centerMino(Mino.O, Rotation.reverse)).toBe(2);
    expect(centerMino(Mino.O, Rotation.left)).toBe(3);
  });

  test('bottomLeftToCenterMino', () => {
    // check if shifting using the x, y
    expect(bottomLeftToCenterMino(0, 0, Mino.T, Rotation.spawn)).toEqual({x: 1, y: 0});
    expect(bottomLeftToCenterMino(1, 0, Mino.T, Rotation.spawn)).toEqual({x: 2, y: 0});
    expect(bottomLeftToCenterMino(0, 1, Mino.T, Rotation.spawn)).toEqual({x: 1, y: 1});
    expect(bottomLeftToCenterMino(1, 1, Mino.T, Rotation.spawn)).toEqual({x: 2, y: 1});
    expect(bottomLeftToCenterMino(5, 3, Mino.T, Rotation.spawn)).toEqual({x: 6, y: 3});

    expect(bottomLeftToCenterMino(0, 0, Mino.T, Rotation.right)).toEqual({x: 0, y: 1});
    expect(bottomLeftToCenterMino(1, 0, Mino.T, Rotation.right)).toEqual({x: 1, y: 1});
    expect(bottomLeftToCenterMino(0, 1, Mino.T, Rotation.right)).toEqual({x: 0, y: 2});
    expect(bottomLeftToCenterMino(1, 1, Mino.T, Rotation.right)).toEqual({x: 1, y: 2});
    expect(bottomLeftToCenterMino(5, 3, Mino.T, Rotation.right)).toEqual({x: 5, y: 4});

    expect(bottomLeftToCenterMino(0, 0, Mino.L, Rotation.reverse)).toEqual({x: 1, y: 1});
    expect(bottomLeftToCenterMino(1, 0, Mino.L, Rotation.reverse)).toEqual({x: 2, y: 1});
    expect(bottomLeftToCenterMino(0, 1, Mino.L, Rotation.reverse)).toEqual({x: 1, y: 2});
    expect(bottomLeftToCenterMino(1, 1, Mino.L, Rotation.reverse)).toEqual({x: 2, y: 2});
    expect(bottomLeftToCenterMino(5, 3, Mino.L, Rotation.reverse)).toEqual({x: 6, y: 4});

    // center is outside the board
    expect(bottomLeftToCenterMino(9, 4, Mino.T, Rotation.spawn)).toEqual({x: 10, y: 4});
    expect(bottomLeftToCenterMino(0, 4, Mino.J, Rotation.reverse)).toEqual({x: -1, y: 5});

    expect(bottomLeftToCenterMino(5, 5, Mino.T, Rotation.spawn)).toEqual({x: 6, y: 5});
    expect(bottomLeftToCenterMino(5, 5, Mino.T, Rotation.right)).toEqual({x: 5, y: 6});
    expect(bottomLeftToCenterMino(5, 5, Mino.T, Rotation.reverse)).toEqual({x: 5, y: 6});
    expect(bottomLeftToCenterMino(5, 5, Mino.T, Rotation.left)).toEqual({x: 5, y: 6});

    expect(bottomLeftToCenterMino(5, 5, Mino.I, Rotation.spawn)).toEqual({x: 6, y: 5});
    expect(bottomLeftToCenterMino(5, 5, Mino.I, Rotation.right)).toEqual({x: 5, y: 7});
    expect(bottomLeftToCenterMino(5, 5, Mino.I, Rotation.reverse)).toEqual({x: 7, y: 5});
    expect(bottomLeftToCenterMino(5, 5, Mino.I, Rotation.left)).toEqual({x: 5, y: 6});

    expect(bottomLeftToCenterMino(5, 5, Mino.L, Rotation.spawn)).toEqual({x: 6, y: 5});
    expect(bottomLeftToCenterMino(5, 5, Mino.L, Rotation.right)).toEqual({x: 5, y: 6});
    expect(bottomLeftToCenterMino(5, 5, Mino.L, Rotation.reverse)).toEqual({x: 6, y: 6});
    expect(bottomLeftToCenterMino(5, 5, Mino.L, Rotation.left)).toEqual({x: 5, y: 6});

    expect(bottomLeftToCenterMino(5, 5, Mino.J, Rotation.spawn)).toEqual({x: 6, y: 5});
    expect(bottomLeftToCenterMino(5, 5, Mino.J, Rotation.right)).toEqual({x: 5, y: 6});
    expect(bottomLeftToCenterMino(5, 5, Mino.J, Rotation.reverse)).toEqual({x: 4, y: 6});
    expect(bottomLeftToCenterMino(5, 5, Mino.J, Rotation.left)).toEqual({x: 6, y: 6});

    expect(bottomLeftToCenterMino(5, 5, Mino.S, Rotation.spawn)).toEqual({x: 6, y: 5});
    expect(bottomLeftToCenterMino(5, 5, Mino.S, Rotation.right)).toEqual({x: 4, y: 6});
    expect(bottomLeftToCenterMino(5, 5, Mino.S, Rotation.reverse)).toEqual({x: 6, y: 6});
    expect(bottomLeftToCenterMino(5, 5, Mino.S, Rotation.left)).toEqual({x: 5, y: 6});

    expect(bottomLeftToCenterMino(5, 5, Mino.Z, Rotation.spawn)).toEqual({x: 5, y: 5});
    expect(bottomLeftToCenterMino(5, 5, Mino.Z, Rotation.right)).toEqual({x: 5, y: 6});
    expect(bottomLeftToCenterMino(5, 5, Mino.Z, Rotation.reverse)).toEqual({x: 5, y: 6});
    expect(bottomLeftToCenterMino(5, 5, Mino.Z, Rotation.left)).toEqual({x: 6, y: 6});

    expect(bottomLeftToCenterMino(5, 5, Mino.O, Rotation.spawn)).toEqual({x: 5, y: 5});
    expect(bottomLeftToCenterMino(5, 5, Mino.O, Rotation.right)).toEqual({x: 5, y: 6});
    expect(bottomLeftToCenterMino(5, 5, Mino.O, Rotation.reverse)).toEqual({x: 6, y: 6});
    expect(bottomLeftToCenterMino(5, 5, Mino.O, Rotation.left)).toEqual({x: 6, y: 5});
  })

  test('decodeWrapper', () => {
    expect(decodeWrapper('v115@vhAAgH')).toEqual(decoder.decode('v115@vhAAgH'))
    expect(decodeWrapper('v115@tgA8HeB8HeB8GeA8AeA8BeB8BeA8BeA8AeC8BeA8Be?B8BeA8KeAgH')).toEqual(decoder.decode('v115@tgA8HeB8HeB8GeA8AeA8BeB8BeA8BeA8AeC8BeA8Be?B8BeA8KeAgH'))
    expect(decodeWrapper('v115@tgA8HeB8HeB8GeA8AeA8BeB8BeA8BeA8AeC8BeA8Be?B8BeA8KeeCJ')).toEqual(decoder.decode('v115@tgA8HeB8HeB8GeA8AeA8BeB8BeA8BeA8AeC8BeA8Be?B8BeA8KeeCJ'))

    expect(() => decodeWrapper('')).toThrow('could not be decoded')
    expect(() => decodeWrapper('v15@vhAAgH')).toThrow('could not be decoded')
  })

  test('isValidPieceChar', () => {
    expect(isValidPieceChar('T')).toBeTruthy();
    expect(isValidPieceChar('I')).toBeTruthy();
    expect(isValidPieceChar('L')).toBeTruthy();
    expect(isValidPieceChar('J')).toBeTruthy();
    expect(isValidPieceChar('S')).toBeTruthy();
    expect(isValidPieceChar('Z')).toBeTruthy();
    expect(isValidPieceChar('O')).toBeTruthy();

    expect(isValidPieceChar('_')).toBeFalsy();
    expect(isValidPieceChar('X')).toBeFalsy();
    expect(isValidPieceChar('a')).toBeFalsy();
    expect(isValidPieceChar('-')).toBeFalsy();
  })

  test('isMinoPiece', () => {
    expect.assertions(9);

    expect(isMinoPiece(Mino._)).toBeFalsy();
    expect(isMinoPiece(Mino.T)).toBeTruthy();
    expect(isMinoPiece(Mino.I)).toBeTruthy();
    expect(isMinoPiece(Mino.L)).toBeTruthy();
    expect(isMinoPiece(Mino.J)).toBeTruthy();
    expect(isMinoPiece(Mino.S)).toBeTruthy();
    expect(isMinoPiece(Mino.Z)).toBeTruthy();
    expect(isMinoPiece(Mino.O)).toBeTruthy();
    expect(isMinoPiece(Mino.X)).toBeFalsy();
  })

  test('inBounds', () => {
    expect(inBounds(0, 0, 4)).toBeTruthy();
    expect(inBounds(0, 0, 1)).toBeTruthy();
    expect(inBounds(5, 6, 7)).toBeTruthy();
    expect(inBounds(3, 2, 3)).toBeTruthy();
    expect(inBounds(0, 0, 0)).toBeFalsy();
    expect(inBounds(-1, 0, 4)).toBeFalsy();
    expect(inBounds(WIDTH, 0, 4)).toBeFalsy();
    expect(inBounds(0, -1, 4)).toBeFalsy();
    expect(inBounds(0, 5, 4)).toBeFalsy();
    expect(inBounds(0, HEIGHT, 4)).toBeFalsy();
  })

  test('findLineClears', () => {
    const emptyField = new EncodedField(decodeWrapper('v115@vhAAgH')[0].field, HEIGHT);
    const oneLineClearField = new EncodedField(decodeWrapper('v115@bhJ8JeAgH')[0].field, HEIGHT);
    const twoLineClearField = new EncodedField(decodeWrapper('v115@HhS8AeJ8JeAgH')[0].field, HEIGHT);

    // expect to find no line clears on empty board with no rows modified
    expect(findLineClears(emptyField, 0)).toBe(0);
    // expect to find no line clear on empty board with some rows modified
    expect(findLineClears(emptyField, 0b101)).toBe(0);

    // find no line clears as no rows modified
    expect(findLineClears(oneLineClearField, 0)).toBe(0);
    // finds line clear
    expect(findLineClears(oneLineClearField, 0b1)).toBe(0b1);
    // finds only the one line clear
    expect(findLineClears(oneLineClearField, 0b11)).toBe(0b1);

    // finds one line clear
    expect(findLineClears(twoLineClearField, 0b1)).toBe(0b1);
    // finds only the one line clear
    expect(findLineClears(twoLineClearField, 0b11)).toBe(0b1);
    // finds both line clears
    expect(findLineClears(twoLineClearField, 0b111)).toBe(0b101);
  })

  test('clearLines', () => {
    const oneLineClearField = new EncodedField(decodeWrapper('v115@bhJ8JeAgH')[0].field, HEIGHT);

    // clear line
    expect(oneLineClearField.at(0, 0)).toBe(Mino.X);
    clearLines(oneLineClearField, 0b1)
    expect(oneLineClearField.at(0, 0)).toBe(Mino._);

    const twoLineClearField = new EncodedField(decodeWrapper('v115@HhS8AeJ8JeAgH')[0].field, HEIGHT);

    // clear line that isn't a line clear should shift down the full row above
    expect(twoLineClearField.at(9, 1)).toBe(Mino._);
    clearLines(twoLineClearField, 0b10)
    expect(twoLineClearField.at(9, 1)).toBe(Mino.X);

    // clear rest of lines
    clearLines(twoLineClearField, 0b11)
    expect(twoLineClearField.at(0, 0)).toBe(Mino._);
  })
});
