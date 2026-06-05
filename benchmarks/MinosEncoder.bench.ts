import { bench, run, group } from 'mitata';

import { Rotation, WIDTH, HEIGHT } from '../src/lib/defines';
import { Piece, Pos } from '../src/lib/types';
import { getOffsets, centerMino, inBounds } from '../src/lib/utils';
import MinosEncoder from '../src/lib/MinosEncoder';

function positions(x: number, y: number, piece: Piece, rotation: Rotation): Pos[] {
  // get offset and center index
  const offsets = getOffsets(piece, rotation);
  const centerIndex = centerMino(piece, rotation);

  // get base x, y offset of center mino
  const [bx, by] = offsets[centerIndex];

  // get minos centered at given x, y
  const minos: Pos[] = [];
  for (let [dx, dy] of offsets) {
    let mino = {x: x + dx - bx, y: y + dy - by};
    if (!inBounds(mino.x, mino.y)) return [];
    minos.push(mino);
  }

  return minos;
}

function randint(limit: number) {
  return Math.floor(Math.random() * limit)
}

const inputs: {x: number, y: number, piece: Piece, rotation: Rotation}[] = []
for (let _ = 0; _ < 10_000; _++) {
  inputs.push({x: randint(WIDTH), y: randint(HEIGHT), piece: (randint(7) + 1) as Piece, rotation: randint(4)})
}

group('Method: .positions()', () => {
  bench('Original positions', () => {
    for (let input of inputs) {
      positions(input.x, input.y, input.piece, input.rotation);
    }
  })
  bench('Encoded positions', () => {
    for (let input of inputs) {
      MinosEncoder.positions(input.x, input.y, input.piece, input.rotation);
    }
  })
})

await run();
