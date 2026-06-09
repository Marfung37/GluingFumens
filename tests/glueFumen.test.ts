import { test, expect } from '@jest/globals';

import { glueFumen } from '../src/index';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const currentFileDir = path.dirname(fileURLToPath(import.meta.url));
const glues = path.join(currentFileDir, 'gluedFumens.txt');
const gluesSrs = path.join(currentFileDir, 'gluedFumensSrs.txt');
const unglues = path.join(currentFileDir, 'ungluedFumens.txt');

describe('glueFumen', () => {
  test('Fumens with no pieces', () => {
    // empty board
    expect(glueFumen('v115@vhAAgH')).toEqual(['v115@vhAAgH']);

    // some gray cells
    expect(glueFumen('v115@bhF8NeAgH')).toEqual(['v115@bhF8NeAgH']);

    // multipage empty board
    expect(glueFumen('v115@vhDAgHAgHAgHAgH')).toEqual([
      'v115@vhAAgH',
      'v115@vhAAgH',
      'v115@vhAAgH',
      'v115@vhAAgH'
    ]);

    // multipage gray board
    expect(glueFumen('v115@/gA8DeA8PeA8AeA8CeC8CeA8BeA8JeAgHvhDAgHAgH?AgHAgH')).toEqual([
      'v115@/gA8DeA8PeA8AeA8CeC8CeA8BeA8JeAgH',
      'v115@/gA8DeA8PeA8AeA8CeC8CeA8BeA8JeAgH',
      'v115@/gA8DeA8PeA8AeA8CeC8CeA8BeA8JeAgH',
      'v115@/gA8DeA8PeA8AeA8CeC8CeA8BeA8JeAgH',
      'v115@/gA8DeA8PeA8AeA8CeC8CeA8BeA8JeAgH'
    ]);
  });

  test('Fumens with invalid number of minos', () => {
    expect(glueFumen('v115@ehywNeAgH')).toEqual([]);
    expect(glueFumen('v115@dhwhBewhBewhKeAgH')).toEqual([]);
    expect(glueFumen('v115@MhglKeA8DeglCeA8MeAgH')).toEqual([]);
    expect(glueFumen('v115@Shh0A8Geg0ReAgH')).toEqual([]);
    expect(glueFumen('v115@WfA8ReQpReAtReQ4Reg0ReglRewhRewwSeAgH')).toEqual([]);
    expect(glueFumen('v115@chh0xwOeAgH')).toEqual([]);
    expect(glueFumen('v115@9gBtDeh0hlwwBtCeg0RpglxwR4AeA8g0RpglwwR4il?zhJeAgH')).toEqual([]);
  });

  test('Fumens with one piece', () => {
    const floatingPieces = true;
    // T
    expect(glueFumen('v115@kgwwHeyw+eAgH', { floatingPieces })).toEqual(['v115@vhA13I']);
    expect(glueFumen('v115@kgwwIexwHeww1eAgH', { floatingPieces })).toEqual(['v115@vhAt3I']);
    expect(glueFumen('v115@tgywHeww1eAgH', { floatingPieces })).toEqual(['v115@vhAl3I']);
    expect(glueFumen('v115@kgwwHexwIeww1eAgH', { floatingPieces })).toEqual(['v115@vhA93I']);
    // I
    expect(glueFumen('v115@tgzh9eAgH', { floatingPieces })).toEqual(['v115@vhAx3I']);
    expect(glueFumen('v115@kgwhIewhIewhIewhreAgH', { floatingPieces })).toEqual(['v115@vhAp3I']);
    expect(glueFumen('v115@sgzh+eAgH', { floatingPieces })).toEqual(['v115@vhAR3I']);
    expect(glueFumen('v115@agwhIewhIewhIewh1eAgH', { floatingPieces })).toEqual(['v115@vhApyI']);
    // L
    expect(glueFumen('v115@lgglGeil+eAgH', { floatingPieces })).toEqual(['v115@vhAy3I']);
    expect(glueFumen('v115@kgglIeglIehl0eAgH', { floatingPieces })).toEqual(['v115@vhAq3I']);
    expect(glueFumen('v115@tgilGegl2eAgH', { floatingPieces })).toEqual(['v115@vhAi3I']);
    expect(glueFumen('v115@jghlIeglIegl1eAgH', { floatingPieces })).toEqual(['v115@vhA63I']);
    // J
    expect(glueFumen('v115@jgg0Iei0+eAgH', { floatingPieces })).toEqual(['v115@vhA23I']);
    expect(glueFumen('v115@kgh0Heg0Ieg01eAgH', { floatingPieces })).toEqual(['v115@vhAu3I']);
    expect(glueFumen('v115@tgi0Ieg00eAgH', { floatingPieces })).toEqual(['v115@vhAm3I']);
    expect(glueFumen('v115@kgg0Ieg0Heh01eAgH', { floatingPieces })).toEqual(['v115@vhA+3I']);
    // S
    expect(glueFumen('v115@kgR4GeR4/eAgH', { floatingPieces })).toEqual(['v115@vhA3yI']);
    expect(glueFumen('v115@kgQ4IeR4IeQ40eAgH', { floatingPieces })).toEqual(['v115@vhAP4I']);
    expect(glueFumen('v115@ugR4GeR41eAgH', { floatingPieces })).toEqual(['v115@vhA33I']);
    expect(glueFumen('v115@jgQ4IeR4IeQ41eAgH', { floatingPieces })).toEqual(['v115@vhAv3I']);
    // Z
    expect(glueFumen('v115@jgBtIeBt+eAgH', { floatingPieces })).toEqual(['v115@vhA0yI']);
    expect(glueFumen('v115@lgAtHeBtHeAt1eAgH', { floatingPieces })).toEqual(['v115@vhAs3I']);
    expect(glueFumen('v115@tgBtIeBt0eAgH', { floatingPieces })).toEqual(['v115@vhA03I']);
    expect(glueFumen('v115@kgAtHeBtHeAt2eAgH', { floatingPieces })).toEqual(['v115@vhAM3I']);
    // O
    expect(glueFumen('v115@kgRpHeRp+eAgH', { floatingPieces })).toEqual(['v115@vhAzyI']);
    expect(glueFumen('v115@ugRpHeRp0eAgH', { floatingPieces })).toEqual(['v115@vhAz3I']);
    expect(glueFumen('v115@tgRpHeRp1eAgH', { floatingPieces })).toEqual(['v115@vhAT3I']);
    expect(glueFumen('v115@jgRpHeRp/eAgH', { floatingPieces })).toEqual(['v115@vhATyI']);
  });

  test('Variety of 10p solves', () => {
    const inputData = fs.readFileSync(unglues, { encoding: 'utf8' }).trim().split('\n');
    const targetData = fs.readFileSync(glues, { encoding: 'utf8' }).trim().split('\n');

    for (let i = 0; i < inputData.length; i++) {
      expect(glueFumen(inputData[i].trim())).toEqual([targetData[i].trim()]);
    }
  });

  test('Variety of 10p solves with srs 180', () => {
    const inputData = fs.readFileSync(unglues, { encoding: 'utf8' }).trim().split('\n');
    const targetData = fs.readFileSync(gluesSrs, { encoding: 'utf8' }).trim().split('\n');

    for (let i = 0; i < inputData.length; i++) {
      expect(glueFumen(inputData[i].trim(), { srs180: true })).toEqual([targetData[i].trim()]);
    }
  });

  test('Order and hold', () => {
    // fumen with a strict order
    expect(
      glueFumen('v115@ffg0Ieg0Heh0HeglGeilHeRpHeRpHewwHeywGeBtIe?BtIeR4GeR4GezhMeAgH', {
        order: 'ISZTOLJ'
      })
    ).toEqual(['v115@vhGRQJ3mBUcBVXBTIBSDBe1A']);
    expect(
      glueFumen('v115@ffg0Ieg0Heh0HeglGeilHeRpHeRpHewwHeywGeBtIe?BtIeR4GeR4GezhMeAgH', {
        order: 'SIZTOLJ'
      })
    ).toEqual([]);
    expect(
      glueFumen('v115@ffg0Ieg0Heh0HeglGeilHeRpHeRpHewwHeywGeBtIe?BtIeR4GeR4GezhMeAgH', {
        order: 'SIZTOLJ',
        hold: 1
      })
    ).toEqual(['v115@vhGRQJ3mBUcBVXBTIBSDBe1A']);
    expect(
      glueFumen('v115@ffg0Ieg0Heh0HeglGeilHeRpHeRpHewwHeywGeBtIe?BtIeR4GeR4GezhMeAgH', {
        order: 'JISZTOL',
        hold: 1
      })
    ).toEqual(['v115@vhGRQJ3mBUcBVXBTIBSDBe1A']);
    expect(
      glueFumen('v115@ffg0Ieg0Heh0HeglGeilHeRpHeRpHewwHeywGeBtIe?BtIeR4GeR4GezhMeAgH', {
        order: 'JIZSTOL',
        hold: 1
      })
    ).toEqual([]);
    expect(
      glueFumen('v115@ffg0Ieg0Heh0HeglGeilHeRpHeRpHewwHeywGeBtIe?BtIeR4GeR4GezhMeAgH', {
        order: 'JIZSTOL',
        hold: 2
      })
    ).toEqual(['v115@vhGRQJ3mBUcBVXBTIBSDBe1A']);
    expect(
      glueFumen('v115@ffg0Ieg0Heh0HeglGeilHeRpHeRpHewwHeywGeBtIe?BtIeR4GeR4GezhMeAgH', {
        order: 'ZISOJTL',
        hold: 2
      })
    ).toEqual(['v115@vhGRQJ3mBUcBVXBTIBSDBe1A']);
    expect(
      glueFumen('v115@ffg0Ieg0Heh0HeglGeilHeRpHeRpHewwHeywGeBtIe?BtIeR4GeR4GezhMeAgH', {
        order: 'JLOTZSI',
        hold: 5
      })
    ).toEqual([]);
    expect(
      glueFumen('v115@ffg0Ieg0Heh0HeglGeilHeRpHeRpHewwHeywGeBtIe?BtIeR4GeR4GezhMeAgH', {
        order: 'JLOTZSI',
        hold: 6
      })
    ).toEqual(['v115@vhGRQJ3mBUcBVXBTIBSDBe1A']);
    expect(
      glueFumen('v115@ffg0Ieg0Heh0HeglGeilHeRpHeRpHewwHeywGeBtIe?BtIeR4GeR4GezhMeAgH', {
        order: 'JLOTZSI',
        hold: 7
      })
    ).toEqual(['v115@vhGRQJ3mBUcBVXBTIBSDBe1A']);
  });

  test('Edge cases', () => {
    // handling pieces the become floating
    expect(glueFumen('v115@qgRpHeRpGezhE8whA8HewhIewhIewhJeAgH')).toEqual([
      'v115@BhE8AeA8mex/IvhBzVBpoB'
    ]);
    expect(
      glueFumen(
        'v115@jfwhIewhIewhIewhIezhE8whCewhEewhCewhEewhCe?whEewhCewhEeA8whB8zhC8whEeA8CewhIewhSeAgH'
      )
    ).toEqual(['v115@PgE8neA8AeB8DeC8FeA8geRBJvhEpRBJkBxLBJ8ApU?B']);

    // multi output
    expect(
      glueFumen('v115@fgi0G8whi0F8whi0F8whi0F8whi0F8h0H8i0G8JeAg?H', { solutionLimit: 0 })
    ).toEqual([
      'v115@igG8DeF8DeF8DeF8DeF8BeH8CeG8Je2OJvhEupBJkB?GlBGqBmpB',
      'v115@igG8DeF8DeF8DeF8DeF8BeH8CeG8Je2OJvhEupBJkB?WlB+qBmpB',
      'v115@igG8DeF8DeF8DeF8DeF8BeH8CeG8Je2OJvhEJfBWqB?+lBupBmpB',
      'v115@igG8DeF8DeF8DeF8DeF8BeH8CeG8Je2OJvhEJfBGlB?upBGlBmpB'
    ]);

    // piece can lead to overhang in srs
    expect(glueFumen('v115@1gR4GeR4GeC8Q4I8R4I8Q4E8JeAgH', { srs180: true })).toEqual([
      'v115@HhC8AeI8BeI8AeE8JeX7IvhAPrB'
    ]);

    // placeable with srs
    expect(glueFumen('v115@VhA8EeA8zhE8JeAgH', { srs180: true })).toEqual([
      'v115@VhA8EeA8DeE8JeRPJ'
    ]);
    // not placeable with srs as shifted by one
    expect(glueFumen('v115@WhA8DeB8zhD8JeAgH', { srs180: true })).toEqual([]);

    // srs check requires doing 180 before able to do Z triple before double
    expect(glueFumen('v115@zgC8BtI8BtI8AtH8BtH8AtE8JeAgH', { srs180: true })).toEqual([
      'v115@zgC8BeI8BeI8AeH8BeH8AeE8JeMLJvhAUrB'
    ]);
  });
});
