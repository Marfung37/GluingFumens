import { test, expect } from '@jest/globals';

import OperationEncoder from '../src/lib/OperationEncoder';
import { Mino, Rotation } from '../src/lib/defines';
import { Pos, Operation } from '../src/lib/types';

const SHIFT = Math.pow(2, 9);

function pack(minos: Pos[]) {
  let value = 0;
  for (const { x, y } of minos) {
    value *= SHIFT;
    value += (x << 5) + y;
  }
  return value;
}

describe('OperationEncoder', () => {
  test('encode', () => {
    const op1 = { x: 1, y: 0, type: 'T', rotation: 'spawn' } as Operation;
    const op2 = { x: 5, y: 0, type: 'T', rotation: 'spawn' } as Operation;
    const op3 = { x: 1, y: 4, type: 'T', rotation: 'spawn' } as Operation;
    const op4 = { x: 1, y: 0, type: 'S', rotation: 'spawn' } as Operation;
    const op5 = { x: 1, y: 0, type: 'T', rotation: 'reverse' } as Operation;
    const op6 = { x: 5, y: 3, type: 'L', rotation: 'left' } as Operation;

    expect(OperationEncoder.encode(op1)).toBe(0b00100000100000);
    expect(OperationEncoder.encode(op2)).toBe(0b00100010100000);
    expect(OperationEncoder.encode(op3)).toBe(0b00100000100100);
    expect(OperationEncoder.encode(op4)).toBe(0b10100000100000);
    expect(OperationEncoder.encode(op5)).toBe(0b00110000100000);
    expect(OperationEncoder.encode(op6)).toBe(0b01111010100011);
  });

  test('encode and decode', () => {
    const op1 = { x: 1, y: 0, type: 'T', rotation: 'spawn' } as Operation;
    const op2 = { x: 5, y: 0, type: 'T', rotation: 'spawn' } as Operation;
    const op3 = { x: 1, y: 4, type: 'T', rotation: 'spawn' } as Operation;
    const op4 = { x: 1, y: 0, type: 'S', rotation: 'spawn' } as Operation;
    const op5 = { x: 1, y: 0, type: 'T', rotation: 'reverse' } as Operation;
    const op6 = { x: 5, y: 3, type: 'L', rotation: 'left' } as Operation;

    expect(OperationEncoder.decode(OperationEncoder.encode(op1))).toEqual(op1);
    expect(OperationEncoder.decode(OperationEncoder.encode(op2))).toEqual(op2);
    expect(OperationEncoder.decode(OperationEncoder.encode(op3))).toEqual(op3);
    expect(OperationEncoder.decode(OperationEncoder.encode(op4))).toEqual(op4);
    expect(OperationEncoder.decode(OperationEncoder.encode(op5))).toEqual(op5);
    expect(OperationEncoder.decode(OperationEncoder.encode(op6))).toEqual(op6);
  });

  test('getters', () => {
    const op = OperationEncoder.encode({ x: 5, y: 3, type: 'L', rotation: 'left' } as Operation);

    expect(OperationEncoder.getY(op)).toBe(3);
    expect(OperationEncoder.getX(op)).toBe(5);
    expect(OperationEncoder.getRotation(op)).toBe(Rotation.left);
    expect(OperationEncoder.getPiece(op)).toBe(Mino.L);
  });

  test('setters', () => {
    const op = OperationEncoder.encode({ x: 5, y: 3, type: 'L', rotation: 'left' } as Operation);

    expect(OperationEncoder.setY(op, 5)).toBe(
      OperationEncoder.encode({ x: 5, y: 5, type: 'L', rotation: 'left' } as Operation)
    );
    expect(OperationEncoder.setX(op, 3)).toBe(
      OperationEncoder.encode({ x: 3, y: 3, type: 'L', rotation: 'left' } as Operation)
    );
    expect(OperationEncoder.setRotation(op, Rotation.reverse)).toBe(
      OperationEncoder.encode({ x: 5, y: 3, type: 'L', rotation: 'reverse' } as Operation)
    );
    expect(OperationEncoder.setPiece(op, Mino.S)).toBe(
      OperationEncoder.encode({ x: 5, y: 3, type: 'S', rotation: 'left' } as Operation)
    );
  });

  test('positions', () => {
    // pick some random ones from all
    expect(
      OperationEncoder.positions(
        OperationEncoder.encode({ x: 5, y: 5, type: 'T', rotation: 'spawn' } as Operation)
      )
    ).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 5 }
      ])
    );

    expect(
      OperationEncoder.positions(
        OperationEncoder.encode({ x: 5, y: 5, type: 'L', rotation: 'left' } as Operation)
      )
    ).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
        { x: 5, y: 4 }
      ])
    );

    expect(
      OperationEncoder.positions(
        OperationEncoder.encode({ x: 5, y: 5, type: 'Z', rotation: 'right' } as Operation)
      )
    ).toEqual(
      pack([
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 6, y: 6 },
        { x: 5, y: 4 }
      ])
    );
  });
});
