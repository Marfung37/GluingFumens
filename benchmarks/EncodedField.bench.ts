import { bench, run, group } from 'mitata';

import { decoder, Field } from 'tetris-fumen';
import EncodedField from '../src/lib/EncodedField';
import { Mino, WIDTH, HEIGHT } from '../src/lib/defines';
import { MinoType } from '../src/lib/types';

const field: Field = decoder.decode('v115@BgBtQ4g0QpglB8Q4glQpAtA8g0glBeA8Beg0wwwhgl?g0Q4AtA8QpA8CeglBeglCemli0glBehlDeg0QpBeA8wwwhg?lg0Q4AtBeA8wwwhglg0Q4AtQpAeA8wwwhglg0Q4AtQpAeA8?wwwhglg0Q4AtQpLeAgH')[0].field;
const encodedField = new EncodedField(field, HEIGHT);

function allAt(at: (x: number, y: number) => Mino | string) {
  for (let x = 0; x < WIDTH; x++)
    for (let y = 0; y < HEIGHT; y++) 
      at(x, y);
}

function allSet(set: (x: number, y: number, mino: MinoType) => void) {
  for (let x = 0; x < WIDTH; x++)
    for (let y = 0; y < HEIGHT; y++)
      set(x, y, 'X');
}

function originalIsLineClear(y: number): boolean {
  for (let x = 0; x < WIDTH; x++) {
    if (field.at(x, y) !== '_') return false;
  }
  return true;
}

function allIsLineClear(isLineClear: (y: number) => boolean): number {
  let count = 0;
  for (let y = 0; y < HEIGHT; y++) {
    if (isLineClear(y)) count++;
  }
  return count;
}

group('Method: .at()', () => {
  bench('Original Field', () => {
    allAt((x, y) => field.at(x, y));
  })
  bench('Encoded Field', () => {
    allAt((x, y) => encodedField.at(x, y));
  })
})

group('Method: .set()', () => {
  bench('Original Field', () => {
    allSet((x, y, mino) => field.set(x, y, mino));
  })
  bench('Encoded Field only set', () => {
    allSet((x, y, mino) => encodedField.set(x, y, mino));
  })
  const fullSet = (x: number, y: number, mino: MinoType) => {
    encodedField.unset(x, y);
    encodedField.set(x, y, mino);
  }
  bench('Encoded Field unset & set', () => {
    allSet(fullSet);
  })
})

group('Method: .isLineClear()', () => {
  bench('Original Field', () => {
    return allIsLineClear((y) => originalIsLineClear(y));
  })
  bench('Encoded Field', () => {
    return allIsLineClear((y) => encodedField.isLineClear(y));
  })
})

group('Method: .lineClear()', () => {
  bench('Original Field', () => {
    field.clearLine();
  })
  bench('Encoded Field', () => {
    for (let y = HEIGHT - 1; y >= 0; y--) {
      if (encodedField.isLineClear(y)) encodedField.lineClear(y);
    }
  })
})

group('Method: .copy()', () => {
  bench('Original Field', () => {
    field.copy();
  });

  bench('Encoded Field', () => {
    encodedField.copy();
  })
})



await run();
