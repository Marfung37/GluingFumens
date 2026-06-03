import { bench, run, group } from 'mitata';
import { decoder, Field } from 'tetris-fumen';
import EncodedField from '../src/lib/EncodedField';
import { WIDTH, HEIGHT } from '../src/lib/defines';

const field: Field = decoder.decode('v115@igglBeglCemli0glBehlDeg0QpBeA8wwwhglg0Q4At?BeA8wwwhglg0Q4AtQpAeA8wwwhglg0Q4AtQpAeA8wwwhglg?0Q4AtQpLeAgH')[0].field;
const encodedField = new EncodedField(field, HEIGHT);

function allAt(field: Field | EncodedField) {
  for (let x = 0; x < WIDTH; x++)
    for (let y = 0; y < HEIGHT; y++) 
      field.at(x, y);
}

group('Method: .at()', () => {
  bench('Original Field', () => {
    allAt(field);
  })
  bench('Encoded Field', () => {
    allAt(encodedField);
  })
})

await run();
