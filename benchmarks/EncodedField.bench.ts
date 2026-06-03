import { bench, run, group } from 'mitata';

import { decoder, Field } from 'tetris-fumen';
import EncodedField from '../src/lib/EncodedField';
import { Mino, WIDTH, HEIGHT } from '../src/lib/defines';
import { MinoType } from '../src/lib/types';

const field: Field = decoder.decode('v115@igglBeglCemli0glBehlDeg0QpBeA8wwwhglg0Q4At?BeA8wwwhglg0Q4AtQpAeA8wwwhglg0Q4AtQpAeA8wwwhglg?0Q4AtQpLeAgH')[0].field;
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

await run();
