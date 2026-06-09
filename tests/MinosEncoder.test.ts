import { test, expect } from '@jest/globals';

import { Pos } from '../src/lib/types';
import { Mino, Rotation } from '../src/lib/defines';
import MinosEncoder from '../src/lib/MinosEncoder';

const SHIFT = Math.pow(2, 9);
const positions = MinosEncoder.positions;

function pack(minos: Pos[]) {
  let value = 0;
  for (const { x, y } of minos) {
    value *= SHIFT;
    value += (x << 5) + y;
  }
  return value;
}

describe('MinosEncoder', () => {
  test('positions', () => {
    // check that positions depend on given x, y
    expect(positions(1, 0, Mino.T, Rotation.spawn)).toEqual(
      pack([
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 0 }
      ])
    );
    expect(positions(2, 0, Mino.T, Rotation.spawn)).toEqual(
      pack([
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 2, y: 1 },
        { x: 1, y: 0 }
      ])
    );
    expect(positions(1, 1, Mino.T, Rotation.spawn)).toEqual(
      pack([
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
        { x: 0, y: 1 }
      ])
    );
    expect(positions(2, 1, Mino.T, Rotation.spawn)).toEqual(
      pack([
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 2, y: 2 },
        { x: 1, y: 1 }
      ])
    );

    // check all pieces are getting right positions
    expect(positions(5, 5, Mino.T, Rotation.spawn)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 5 }
      ])
    );
    expect(positions(5, 5, Mino.T, Rotation.right)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 6, y: 5 },
        { x: 5, y: 4 }
      ])
    );
    expect(positions(5, 5, Mino.T, Rotation.reverse)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 4, y: 5 },
        { x: 5, y: 4 }
      ])
    );
    expect(positions(5, 5, Mino.T, Rotation.left)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 5 },
        { x: 5, y: 4 }
      ])
    );

    expect(positions(5, 5, Mino.I, Rotation.spawn)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 },
        { x: 4, y: 5 }
      ])
    );
    expect(positions(5, 5, Mino.I, Rotation.right)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 5, y: 4 },
        { x: 5, y: 6 },
        { x: 5, y: 3 }
      ])
    );
    expect(positions(5, 5, Mino.I, Rotation.reverse)).toEqual(
      pack([
        { x: 4, y: 5 },
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 3, y: 5 }
      ])
    );
    expect(positions(5, 5, Mino.I, Rotation.left)).toEqual(
      pack([
        { x: 5, y: 6 },
        { x: 5, y: 5 },
        { x: 5, y: 7 },
        { x: 5, y: 4 }
      ])
    );

    expect(positions(5, 5, Mino.L, Rotation.spawn)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 6, y: 6 },
        { x: 6, y: 5 },
        { x: 4, y: 5 }
      ])
    );
    expect(positions(5, 5, Mino.L, Rotation.right)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 6, y: 4 },
        { x: 5, y: 4 }
      ])
    );
    expect(positions(5, 5, Mino.L, Rotation.reverse)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 4, y: 5 },
        { x: 4, y: 4 }
      ])
    );
    expect(positions(5, 5, Mino.L, Rotation.left)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
        { x: 5, y: 4 }
      ])
    );

    expect(positions(5, 5, Mino.J, Rotation.spawn)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 4, y: 6 },
        { x: 4, y: 5 }
      ])
    );
    expect(positions(5, 5, Mino.J, Rotation.right)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 6, y: 6 },
        { x: 5, y: 6 },
        { x: 5, y: 4 }
      ])
    );
    expect(positions(5, 5, Mino.J, Rotation.reverse)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 4, y: 5 },
        { x: 6, y: 4 }
      ])
    );
    expect(positions(5, 5, Mino.J, Rotation.left)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 5, y: 4 },
        { x: 4, y: 4 }
      ])
    );

    expect(positions(5, 5, Mino.S, Rotation.spawn)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 6, y: 6 },
        { x: 4, y: 5 }
      ])
    );
    expect(positions(5, 5, Mino.S, Rotation.right)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 5, y: 6 },
        { x: 6, y: 4 }
      ])
    );
    expect(positions(5, 5, Mino.S, Rotation.reverse)).toEqual(
      pack([
        { x: 5, y: 4 },
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 4, y: 4 }
      ])
    );
    expect(positions(5, 5, Mino.S, Rotation.left)).toEqual(
      pack([
        { x: 4, y: 5 },
        { x: 5, y: 5 },
        { x: 4, y: 6 },
        { x: 5, y: 4 }
      ])
    );

    expect(positions(5, 5, Mino.Z, Rotation.spawn)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 6, y: 5 }
      ])
    );
    expect(positions(5, 5, Mino.Z, Rotation.right)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 6, y: 6 },
        { x: 5, y: 4 }
      ])
    );
    expect(positions(5, 5, Mino.Z, Rotation.reverse)).toEqual(
      pack([
        { x: 5, y: 4 },
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 6, y: 4 }
      ])
    );
    expect(positions(5, 5, Mino.Z, Rotation.left)).toEqual(
      pack([
        { x: 4, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 4 }
      ])
    );

    expect(positions(5, 5, Mino.O, Rotation.spawn)).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 6, y: 6 },
        { x: 6, y: 5 }
      ])
    );
    expect(positions(5, 5, Mino.O, Rotation.right)).toEqual(
      pack([
        { x: 5, y: 4 },
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 6, y: 4 }
      ])
    );
    expect(positions(5, 5, Mino.O, Rotation.reverse)).toEqual(
      pack([
        { x: 4, y: 4 },
        { x: 4, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 4 }
      ])
    );
    expect(positions(5, 5, Mino.O, Rotation.left)).toEqual(
      pack([
        { x: 4, y: 5 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
        { x: 5, y: 5 }
      ])
    );
  });

  test('getMonomino and nextMonomino', () => {
    let minos = positions(1, 0, Mino.T, Rotation.spawn);
    const target = [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 0 }
    ];

    for (let i = target.length - 1; i >= 0; i--) {
      expect(MinosEncoder.getMino(minos)).toEqual(target[i]);
      minos = MinosEncoder.nextMino(minos);
    }

    minos = positions(5, 5, Mino.J, Rotation.reverse);
    const target2 = [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 4, y: 5 },
      { x: 6, y: 4 }
    ];

    for (let i = target2.length - 1; i >= 0; i--) {
      expect(MinosEncoder.getMino(minos)).toEqual(target2[i]);
      minos = MinosEncoder.nextMino(minos);
    }
  });
});
