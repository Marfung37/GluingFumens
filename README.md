# GluingFumens

A npm package with CLI to glue/unglue fumens optimized for speed.

## What is a glued fumen?

A **fumen** is a standard, easily sharable encoding of Tetris board states as a string. Fumens support several features such as multiple pages to allow storing related information of several Tetris boards and piece information per page.
The act of **gluing** a fumen is extracting the information of the pieces that are drawn on the board and outputing a fumen with a piece per page, and **ungluing** a fumen is the inverse operation of a fumen with a piece on each page into one page of all the pieces drawn.

<div align="center">

|                                           Unglued PCO                                            |                                                               Glued PCO                                                                |
| :----------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------: |
| ![PCO with LSZ solve](https://github.com/Marfung37/GluingFumens/blob/main/images/ungluedPCO.png) | ![PCO with LSZ solve with separate frame per piece placement](https://github.com/Marfung37/GluingFumens/blob/main/images/gluedPCO.gif) |

</div>

## Features

- **Uniqueness** - Guarantees to output unique gluing up to order of piece placements
- **Order** - Specifiable string of pieces that must be place in corresponding order up to allowing n-hold
- **SRS** - Allow for pieces to be checked if can be placed using SRS 180 kicktable
- **Optimized Classes**
  - `EncodedField` is a faster, minimal implementation compared to `tetris-fumen` `Field`
  - `MinosEncoder` is an abstract static class for obtaining piece positions quickly
  - `OperationEncoder` is an abstract static class for packing an operation into a number

## Installation

To use this library in your project:

```sh
npm i glue-fumen
```

To get globally for CLI:

```
npm i glue-fumen -g
```

## Usage

### Library

The main `glueFumen` and `unglueFumen` functions

```typescript
import { glueFumen, unglueFumen } from 'glue-fumen';

const glued = glueFumen('v115@9gDtQ4glwhi0wwBtilwhRpg0xwT4whRpglwwR4BtQ4?whilJeAgH');
const unglued = unglueFumen('v115@vhJNJJXqBJnBSyBznB0fBSmBGjBvrB0qB');

console.log(glued);
console.log(unglued);
```

The `EncodedField`, `MinosEncoder`, and `OperationEncoder` classes

```typescript
import { EncodedField, MinosEncoder as mi, OperationEncoder as op } from 'glue-fumen';
import { Mino, Rotation } from 'glue-fumen'; // enums
import { TETROMINO } from 'glue-fumen'; // constant
import type { EncodedOperation, EncodedMinos } from 'glue-fumen';
import { Field } from 'tetris-fumen';

// basic field operations
const field = new EncodedField(Field.create());
field.set(0, 0, 'I');
console.log(field.at(0, 0));
field.unset(0, 0);
console.log(field.at(0, 0));

// packing of operation into number
const operation: EncodedOperation = op.encode({ x: 1, y: 0, type: 'T', rotation: 'spawn' });
console.log(operation);
console.log(op.decode(operation));
console.log(
  op.getX(operation),
  op.getY(operation),
  op.getPiece(operation),
  op.getRotation(operation)
);

// get individual minos of a piece
let minos: EncodedMinos = mi.positions(1, 0, Mino.T, Rotation.spawn);
console.log(minos, op.positions(operation)); // same value
for (let i = 0; i < TETROMINO; i++) {
  console.log(mi.getMino(minos));
  minos = mi.nextMino(minos);
}
```

### CLI

Locally in a NPM project

```sh
npx glue-fumen 'v115@9gDtQ4glwhi0wwBtilwhRpg0xwT4whRpglwwR4BtQ4?whilJeAgH'
```

Installed globally

```sh
glue-fumen 'v115@9gDtQ4glwhi0wwBtilwhRpg0xwT4whRpglwwR4BtQ4?whilJeAgH'
```

#### Options

| Option | Type      | Default | Description                                                                                                                            |
| :----- | :-------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------- |
| `-l`   | `number`  | `1`     | Maximum number of solutions for each of the fumens. Stops once the number of solutions is found. Nonpositive values for all solutions. |
| `-f`   | `boolean` | `false` | Allow for floating pieces.                                                                                                             |
| `-o`   | `string`  | `''`    | Given order of pieces to be placed.                                                                                                    |
| `-d`   | `number`  | `0`     | Number of hold for handling order. Requires order to apply.                                                                            |
| `-s`   | `boolean` | `false` | Check if pieces are reachable through SRS 180 kicktable.                                                                               |
| `-x`   | `boolean` | `false` | Unglues glued fumens. All other options are ignored if this is set.                                                                    |
