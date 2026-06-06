import { test, expect } from '@jest/globals';

import { unglueFumen } from '../src/index';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const currentFileDir = path.dirname(fileURLToPath(import.meta.url));
const glues = path.join(currentFileDir, 'gluedFumens.txt');
const unglues = path.join(currentFileDir, 'ungluedFumens.txt');

describe('unglueFumen', () => {
  test('Fumens with no pieces', () => {
    // empty board
    expect(unglueFumen('v115@vhAAgH')).toBe('v115@vhAAgH');

    // some gray cells
    expect(unglueFumen('v115@bhF8NeAgH')).toBe('v115@bhF8NeAgH');

    // colored diagonal
    expect(unglueFumen('v115@WfA8ReQpReAtReQ4Reg0ReglRewhRewwSeAgH')).toBe('v115@WfA8ReQpReAtReQ4Reg0ReglRewhRewwSeAgH');

    // unglue always outputs only one page back

    // multipage empty board
    expect(unglueFumen('v115@vhDAgHAgHAgHAgH')).toBe('v115@vhAAgH');

    // multipage gray board
    expect(unglueFumen('v115@/gA8DeA8PeA8AeA8CeC8CeA8BeA8JeAgHvhDAgHAgH?AgHAgH')).toBe('v115@/gA8DeA8PeA8AeA8CeC8CeA8BeA8JeAgH');

    // multipage colored diagonal
    expect(unglueFumen('v115@WfA8ReQpReAtReQ4Reg0ReglRewhRewwSeAgHvhBAg?HAgH')).toBe('v115@WfA8ReQpReAtReQ4Reg0ReglRewhRewwSeAgH');
  })

  test('Fumens with all rotations of the pieces', () => {
    expect.assertions(28);

    // T
    expect(unglueFumen('v115@vhA13I')).toBe('v115@kgwwHeyw+eAgH')
    expect(unglueFumen('v115@vhAt3I')).toBe('v115@kgwwIexwHeww1eAgH')
    expect(unglueFumen('v115@vhAl3I')).toBe('v115@tgywHeww1eAgH')
    expect(unglueFumen('v115@vhA93I')).toBe('v115@kgwwHexwIeww1eAgH')
    // I
    expect(unglueFumen('v115@vhAx3I')).toBe('v115@tgzh9eAgH')
    expect(unglueFumen('v115@vhAp3I')).toBe('v115@kgwhIewhIewhIewhreAgH')
    expect(unglueFumen('v115@vhAB3I')).toBe('v115@sgzh+eAgH')
    expect(unglueFumen('v115@vhA5yI')).toBe('v115@agwhIewhIewhIewh1eAgH')
    // L
    expect(unglueFumen('v115@vhAy3I')).toBe('v115@lgglGeil+eAgH')
    expect(unglueFumen('v115@vhAq3I')).toBe('v115@kgglIeglIehl0eAgH')
    expect(unglueFumen('v115@vhAi3I')).toBe('v115@tgilGegl2eAgH')
    expect(unglueFumen('v115@vhA63I')).toBe('v115@jghlIeglIegl1eAgH')
    // J
    expect(unglueFumen('v115@vhA23I')).toBe('v115@jgg0Iei0+eAgH')
    expect(unglueFumen('v115@vhAu3I')).toBe('v115@kgh0Heg0Ieg01eAgH')
    expect(unglueFumen('v115@vhAm3I')).toBe('v115@tgi0Ieg00eAgH')
    expect(unglueFumen('v115@vhA+3I')).toBe('v115@kgg0Ieg0Heh01eAgH')
    // S
    expect(unglueFumen('v115@vhA3yI')).toBe('v115@kgR4GeR4/eAgH')
    expect(unglueFumen('v115@vhAP4I')).toBe('v115@kgQ4IeR4IeQ40eAgH')
    expect(unglueFumen('v115@vhAn3I')).toBe('v115@ugR4GeR41eAgH')
    expect(unglueFumen('v115@vhA/3I')).toBe('v115@jgQ4IeR4IeQ41eAgH')
    // Z
    expect(unglueFumen('v115@vhA0yI')).toBe('v115@jgBtIeBt+eAgH')
    expect(unglueFumen('v115@vhAs3I')).toBe('v115@lgAtHeBtHeAt1eAgH')
    expect(unglueFumen('v115@vhAk3I')).toBe('v115@tgBtIeBt0eAgH')
    expect(unglueFumen('v115@vhAc3I')).toBe('v115@kgAtHeBtHeAt2eAgH')
    // O
    expect(unglueFumen('v115@vhAzyI')).toBe('v115@kgRpHeRp+eAgH')
    expect(unglueFumen('v115@vhAr3I')).toBe('v115@ugRpHeRp0eAgH')
    expect(unglueFumen('v115@vhAD3I')).toBe('v115@tgRpHeRp1eAgH')
    expect(unglueFumen('v115@vhAbyI')).toBe('v115@jgRpHeRp/eAgH')
  })

  test('Running through variety of 10p solves', () => {
    const inputData = fs.readFileSync(glues, { encoding: 'utf8' }).trim().split('\n');
    const targetData = fs.readFileSync(unglues, { encoding: 'utf8' }).trim().split('\n');

    for (let i = 0; i < inputData.length; i++) {
      expect(unglueFumen(inputData[i].trim())).toBe(targetData[i].trim());
    }
  })

  test('Edge cases', () => {
    // weird 6L
    expect(unglueFumen('v115@igG8DeF8DeF8DeF8DeF8BeH8CeG8Je2OJvhEupBJkB?GlBGqBmpB')).toBe('v115@fgi0G8whi0F8whi0F8whi0F8whi0F8h0H8i0G8JeAg?H');
    expect(unglueFumen('v115@igG8DeF8DeF8DeF8DeF8BeH8CeG8Je2OJvhEupBJkB?WlB+qBmpB')).toBe('v115@fgi0G8whi0F8whi0F8whi0F8whi0F8h0H8i0G8JeAg?H');
    expect(unglueFumen('v115@igG8DeF8DeF8DeF8DeF8BeH8CeG8Je2OJvhEJfBWqB?+lBupBmpB')).toBe('v115@fgi0G8whi0F8whi0F8whi0F8whi0F8h0H8i0G8JeAg?H');
    expect(unglueFumen('v115@igG8DeF8DeF8DeF8DeF8BeH8CeG8Je2OJvhEJfBGlB?upBGlBmpB')).toBe('v115@fgi0G8whi0F8whi0F8whi0F8whi0F8h0H8i0G8JeAg?H');

    // weird I piece cut at every mino
    expect(unglueFumen('v115@VgI8AeA8AeG8AeI8LeI8BeH8AeI8TeJEJvhBp+IpEJ')).toBe('v115@VgI8whA8whG8whI8whAewhGexhI8xhH8whI8xhReAg?H');
  })
})
