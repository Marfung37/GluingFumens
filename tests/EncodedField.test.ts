import { test, expect } from '@jest/globals';

import { decodeWrapper } from '../src/lib/utils';
import EncodedField from '../src/lib/EncodedField';
import { Mino, HEIGHT } from '../src/lib/defines';

describe('EncodedField implementation', () => {
  test('constructor and toField', () => {
    // empty field
    const emptyField = decodeWrapper('v115@vhAAgH')[0].field;

    // check constructor exist and reading back field also is empty field
    expect(new EncodedField(emptyField, HEIGHT)).toBeDefined();
    expect(new EncodedField(emptyField, HEIGHT).toField().str()).toEqual(emptyField.str());

    // check various cases
    const twoLineClearField = decodeWrapper('v115@HhS8AeJ8JeAgH')[0].field;

    expect(new EncodedField(twoLineClearField, HEIGHT).toField().str()).toEqual(
      twoLineClearField.str()
    );
    expect(new EncodedField(twoLineClearField, 2).toField().str()).toEqual(
      twoLineClearField.str().split('\n').slice(1).join('\n')
    );
    expect(new EncodedField(twoLineClearField, 1).toField().str()).toEqual(
      twoLineClearField.str().split('\n').slice(2).join('\n')
    );

    const coloredDiagonalField = decodeWrapper('v115@WfA8ReQpReAtReQ4Reg0ReglRewhRewwSeAgH')[0]
      .field;

    expect(new EncodedField(coloredDiagonalField, HEIGHT).toField().str()).toEqual(
      coloredDiagonalField.str()
    );
    expect(new EncodedField(coloredDiagonalField, 3).toField().str()).toEqual(
      coloredDiagonalField
        .str()
        .split('\n')
        .slice(15 - 3)
        .join('\n')
    );
    expect(new EncodedField(coloredDiagonalField, 7).toField().str()).toEqual(
      coloredDiagonalField
        .str()
        .split('\n')
        .slice(15 - 7)
        .join('\n')
    );
    expect(new EncodedField(coloredDiagonalField, 11).toField().str()).toEqual(
      coloredDiagonalField
        .str()
        .split('\n')
        .slice(15 - 11)
        .join('\n')
    );

    const messyField = decodeWrapper(
      'v115@VfglFegli0hlDeg0Ceg0glg0AeQpg0A8AeSph0Aeg0?A8Q4whxwg0QpBeg0A8wwwhAtC8AeQpAtxwzhQpBewwA8Tpw?hA8QpwwAtwwilwwQpA8AexwA8glAeAtQpQ4A8g0wwxhAeAt?glwwQ4glg0AeAtwhAeAtQ4wwAtglwwAeAtQpAtywBeAtR4w?hg0Q4BeAtAeglQ4AeR4Aeg0AeBtglJeAgH'
    )[0].field;

    expect(new EncodedField(messyField, HEIGHT).toField().str()).toEqual(messyField.str());
  });

  test('at', () => {
    // empty field
    const emptyField = new EncodedField(decodeWrapper('v115@vhAAgH')[0].field, HEIGHT);

    // check some empty cells
    expect(emptyField.at(0, 0)).toBe(Mino._);
    expect(emptyField.at(1, 0)).toBe(Mino._);
    expect(emptyField.at(9, 0)).toBe(Mino._);
    expect(emptyField.at(0, 1)).toBe(Mino._);
    expect(emptyField.at(0, 9)).toBe(Mino._);
    expect(emptyField.at(5, 5)).toBe(Mino._);

    const twoLineClearField = new EncodedField(
      decodeWrapper('v115@HhS8AeJ8JeAgH')[0].field,
      HEIGHT
    );

    // check some cells
    expect(twoLineClearField.at(0, 0)).toBe(Mino.X);
    expect(twoLineClearField.at(1, 0)).toBe(Mino.X);
    expect(twoLineClearField.at(9, 0)).toBe(Mino.X);
    expect(twoLineClearField.at(9, 1)).toBe(Mino._);
    expect(twoLineClearField.at(9, 2)).toBe(Mino.X);
    expect(twoLineClearField.at(9, 3)).toBe(Mino._);
    expect(twoLineClearField.at(0, 1)).toBe(Mino.X);
    expect(twoLineClearField.at(0, 2)).toBe(Mino.X);
    expect(twoLineClearField.at(0, 3)).toBe(Mino._);
    expect(twoLineClearField.at(0, 9)).toBe(Mino._);
    expect(twoLineClearField.at(5, 5)).toBe(Mino._);

    const coloredDiagonalField = new EncodedField(
      decodeWrapper('v115@WfA8ReQpReAtReQ4Reg0ReglRewhRewwSeAgH')[0].field,
      HEIGHT
    );

    // check all colored minos
    expect(coloredDiagonalField.at(0, 0)).toBe(Mino.T);
    expect(coloredDiagonalField.at(1, 2)).toBe(Mino.I);
    expect(coloredDiagonalField.at(2, 4)).toBe(Mino.L);
    expect(coloredDiagonalField.at(3, 6)).toBe(Mino.J);
    expect(coloredDiagonalField.at(4, 8)).toBe(Mino.S);
    expect(coloredDiagonalField.at(5, 10)).toBe(Mino.Z);
    expect(coloredDiagonalField.at(6, 12)).toBe(Mino.O);
    expect(coloredDiagonalField.at(7, 14)).toBe(Mino.X);
  });

  test('unset', () => {
    // empty field
    const emptyField = decodeWrapper('v115@vhAAgH')[0].field;
    const encodedEmptyField = new EncodedField(emptyField, HEIGHT);

    // verify unset doesn't change empty field
    encodedEmptyField.unset(0, 0);
    encodedEmptyField.unset(1, 0);
    encodedEmptyField.unset(9, 0);
    encodedEmptyField.unset(0, 1);
    encodedEmptyField.unset(0, 9);
    encodedEmptyField.unset(9, 9);
    encodedEmptyField.unset(5, 5);
    expect(encodedEmptyField.toField().str()).toEqual(emptyField.str());

    const twoLineClearField = decodeWrapper('v115@HhS8AeJ8JeAgH')[0].field;
    const encodedTwoLineClearField = new EncodedField(twoLineClearField, HEIGHT);

    // clear cells and do same with field check same result
    encodedTwoLineClearField.unset(0, 0);
    twoLineClearField.set(0, 0, '_');
    encodedTwoLineClearField.unset(2, 1);
    twoLineClearField.set(2, 1, '_');
    encodedTwoLineClearField.unset(8, 0);
    twoLineClearField.set(8, 0, '_');
    encodedTwoLineClearField.unset(3, 2);
    twoLineClearField.set(3, 2, '_');
    encodedTwoLineClearField.unset(6, 1);
    twoLineClearField.set(6, 1, '_');
    encodedTwoLineClearField.unset(9, 2);
    twoLineClearField.set(9, 2, '_');
    expect(encodedTwoLineClearField.toField().str()).toEqual(twoLineClearField.str());

    const coloredDiagonalField = decodeWrapper('v115@WfA8ReQpReAtReQ4Reg0ReglRewhRewwSeAgH')[0]
      .field;
    const encodedColoredDiagonalField = new EncodedField(coloredDiagonalField, HEIGHT);

    // check all colored minos
    encodedColoredDiagonalField.unset(0, 0);
    encodedColoredDiagonalField.unset(1, 2);
    encodedColoredDiagonalField.unset(2, 4);
    encodedColoredDiagonalField.unset(3, 6);
    encodedColoredDiagonalField.unset(4, 8);
    encodedColoredDiagonalField.unset(5, 10);
    encodedColoredDiagonalField.unset(6, 12);
    encodedColoredDiagonalField.unset(7, 14);

    expect(encodedColoredDiagonalField.toField().str()).toEqual(emptyField.str());
  });

  test('set', () => {
    // setting on empty field
    const emptyField = decodeWrapper('v115@vhAAgH')[0].field;
    const encodedEmptyField = new EncodedField(emptyField, HEIGHT);

    encodedEmptyField.set(0, 0, 'I');
    emptyField.set(0, 0, 'I');
    encodedEmptyField.set(2, 1, 'X');
    emptyField.set(2, 1, 'X');
    encodedEmptyField.set(8, 0, 'L');
    emptyField.set(8, 0, 'L');
    encodedEmptyField.set(3, 2, 'S');
    emptyField.set(3, 2, 'S');
    encodedEmptyField.set(6, 1, 'T');
    emptyField.set(6, 1, 'T');
    encodedEmptyField.set(9, 2, 'J');
    emptyField.set(9, 2, 'J');

    expect(encodedEmptyField.toField().str()).toEqual(emptyField.str());

    // setting on colored field
    let coloredDiagonalField = decodeWrapper('v115@WfA8ReQpReAtReQ4Reg0ReglRewhRewwSeAgH')[0].field;
    let encodedColoredDiagonalField = new EncodedField(coloredDiagonalField, HEIGHT);

    encodedColoredDiagonalField.set(1, 0, 'T');
    coloredDiagonalField.set(1, 0, 'T');
    encodedColoredDiagonalField.set(2, 2, 'I');
    coloredDiagonalField.set(2, 2, 'I');
    encodedColoredDiagonalField.set(3, 4, 'L');
    coloredDiagonalField.set(3, 4, 'L');
    encodedColoredDiagonalField.set(4, 6, 'J');
    coloredDiagonalField.set(4, 6, 'J');
    encodedColoredDiagonalField.set(5, 8, 'S');
    coloredDiagonalField.set(5, 8, 'S');
    encodedColoredDiagonalField.set(6, 10, 'Z');
    coloredDiagonalField.set(6, 10, 'Z');
    encodedColoredDiagonalField.set(7, 12, 'O');
    coloredDiagonalField.set(7, 12, 'O');
    encodedColoredDiagonalField.set(8, 14, 'X');
    coloredDiagonalField.set(8, 14, 'X');

    expect(encodedColoredDiagonalField.toField().str()).toEqual(coloredDiagonalField.str());

    // shifting the colorring
    coloredDiagonalField = decodeWrapper('v115@WfA8ReQpReAtReQ4Reg0ReglRewhRewwSeAgH')[0].field;
    encodedColoredDiagonalField = new EncodedField(coloredDiagonalField, HEIGHT);

    // check all colored minos
    encodedColoredDiagonalField.unset(0, 0);
    encodedColoredDiagonalField.unset(1, 2);
    encodedColoredDiagonalField.unset(2, 4);
    encodedColoredDiagonalField.unset(3, 6);
    encodedColoredDiagonalField.unset(4, 8);
    encodedColoredDiagonalField.unset(5, 10);
    encodedColoredDiagonalField.unset(6, 12);
    encodedColoredDiagonalField.unset(7, 14);

    encodedColoredDiagonalField.set(0, 0, 'I');
    coloredDiagonalField.set(0, 0, 'I');
    encodedColoredDiagonalField.set(1, 2, 'L');
    coloredDiagonalField.set(1, 2, 'L');
    encodedColoredDiagonalField.set(2, 4, 'J');
    coloredDiagonalField.set(2, 4, 'J');
    encodedColoredDiagonalField.set(3, 6, 'S');
    coloredDiagonalField.set(3, 6, 'S');
    encodedColoredDiagonalField.set(4, 8, 'Z');
    coloredDiagonalField.set(4, 8, 'Z');
    encodedColoredDiagonalField.set(5, 10, 'O');
    coloredDiagonalField.set(5, 10, 'O');
    encodedColoredDiagonalField.set(6, 12, 'X');
    coloredDiagonalField.set(6, 12, 'X');
    encodedColoredDiagonalField.set(7, 14, 'T');
    coloredDiagonalField.set(7, 14, 'T');

    expect(encodedColoredDiagonalField.toField().str()).toEqual(coloredDiagonalField.str());
  });

  test('getHeight', () => {
    // check existance
    const emptyField = new EncodedField(decodeWrapper('v115@vhAAgH')[0].field, HEIGHT);

    expect(emptyField.getHeight()).toBeGreaterThanOrEqual(0);

    const twoLineClearField = new EncodedField(
      decodeWrapper('v115@HhS8AeJ8JeAgH')[0].field,
      HEIGHT
    );

    expect(twoLineClearField.getHeight()).toBeGreaterThanOrEqual(3);

    const coloredDiagonalField = new EncodedField(
      decodeWrapper('v115@WfA8ReQpReAtReQ4Reg0ReglRewhRewwSeAgH')[0].field,
      HEIGHT
    );

    expect(coloredDiagonalField.getHeight()).toBeGreaterThanOrEqual(15);

    emptyField.set(0, 0, 'X');
    expect(emptyField.getHeight()).toBeGreaterThanOrEqual(1);
    emptyField.set(0, 4, 'X');
    expect(emptyField.getHeight()).toBeGreaterThanOrEqual(5);
    emptyField.set(0, 2, 'X');
    expect(emptyField.getHeight()).toBeGreaterThanOrEqual(5);

    twoLineClearField.lineClear(0);
    expect(twoLineClearField.getHeight()).toBeGreaterThanOrEqual(2);
    twoLineClearField.lineClear(2);
    expect(twoLineClearField.getHeight()).toBeGreaterThanOrEqual(1);
    twoLineClearField.set(9, 0, 'X');
    expect(twoLineClearField.getHeight()).toBeGreaterThanOrEqual(1);
  });

  test('isLineClear', () => {
    const emptyField = new EncodedField(decodeWrapper('v115@vhAAgH')[0].field, HEIGHT);

    expect(emptyField.isLineClear(0)).toBeFalsy();
    expect(emptyField.isLineClear(1)).toBeFalsy();
    expect(emptyField.isLineClear(3)).toBeFalsy();

    const twoLineClearField = new EncodedField(
      decodeWrapper('v115@HhS8AeJ8JeAgH')[0].field,
      HEIGHT
    );

    expect(twoLineClearField.isLineClear(0)).toBeTruthy();
    expect(twoLineClearField.isLineClear(1)).toBeFalsy();
    expect(twoLineClearField.isLineClear(2)).toBeTruthy();

    const colorfulLineClearField = new EncodedField(
      decodeWrapper(
        'v115@9gQpC8wwwhglg0Q4AtBeA8wwwhglg0Q4AtQpB8wwwh?glg0Q4AtQpB8wwwhglg0Q4AtQpLeAgH'
      )[0].field,
      HEIGHT
    );

    expect(colorfulLineClearField.isLineClear(0)).toBeFalsy();
    expect(colorfulLineClearField.isLineClear(1)).toBeTruthy();
    expect(colorfulLineClearField.isLineClear(2)).toBeFalsy();
    expect(colorfulLineClearField.isLineClear(3)).toBeTruthy();
  });

  test('lineClear', () => {
    const emptyField = decodeWrapper('v115@vhAAgH')[0].field;
    const encodedEmptyField = new EncodedField(emptyField, HEIGHT);

    // expect nothing to happen
    encodedEmptyField.lineClear(0);
    expect(encodedEmptyField.toField().str()).toEqual(emptyField.str());
    encodedEmptyField.lineClear(0);
    expect(encodedEmptyField.toField().str()).toEqual(emptyField.str());

    let twoLineClearField = decodeWrapper('v115@HhS8AeJ8JeAgH')[0].field;
    let encodedTwoLineClearField = new EncodedField(twoLineClearField, HEIGHT);

    encodedTwoLineClearField.lineClear(2);
    expect(encodedTwoLineClearField.toField().str()).toEqual(
      twoLineClearField.str().split('\n').slice(1).join('\n')
    );
    encodedTwoLineClearField.lineClear(0);
    twoLineClearField.clearLine();
    expect(encodedTwoLineClearField.toField().str()).toEqual(twoLineClearField.str());

    twoLineClearField = decodeWrapper('v115@HhS8AeJ8JeAgH')[0].field;
    encodedTwoLineClearField = new EncodedField(twoLineClearField, HEIGHT);

    encodedTwoLineClearField.lineClear(0);
    encodedTwoLineClearField.lineClear(1);
    twoLineClearField.clearLine();
    expect(encodedTwoLineClearField.toField().str()).toEqual(twoLineClearField.str());
  });

  test('copy', () => {
    const emptyField = new EncodedField(decodeWrapper('v115@vhAAgH')[0].field, HEIGHT);
    const newEmptyField = emptyField.copy();
    expect(newEmptyField.toField().str()).toBe(emptyField.toField().str());

    const twoLineClearField = new EncodedField(
      decodeWrapper('v115@HhS8AeJ8JeAgH')[0].field,
      HEIGHT
    );
    const newTwoLineClearField = twoLineClearField.copy();
    expect(newTwoLineClearField.toField().str()).toBe(twoLineClearField.toField().str());

    const coloredDiagonalField = new EncodedField(
      decodeWrapper('v115@WfA8ReQpReAtReQ4Reg0ReglRewhRewwSeAgH')[0].field,
      HEIGHT
    );
    const newColoredDiagonalField = coloredDiagonalField.copy();
    expect(newColoredDiagonalField.toField().str()).toBe(coloredDiagonalField.toField().str());
  });
});
