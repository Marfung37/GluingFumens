import glueFumen from './lib/glueFumen';
import unglueFumen from './lib/unglueFumen';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as path from 'path';

if (require.main == module) {
  const yargsInstance = yargs(hideBin(process.argv))
    .version(false)
    .usage(
      `\nUsage: ${path.basename(__filename)} [fumens...] [options] [< inputFile]\n\nTurns single page fumens with color coded pieces into multipage fumens with a piece on each page.`
    )
    .option('solution-limit', {
      alias: 'l',
      type: 'number',
      description:
        'Maximum number of solutions for each of the fumens. Stops once the number of solutions is found. Nonpositive values for all solutions.',
      default: 1,
      coerce: (arg) => {
        if (!Number.isInteger(arg)) {
          throw new Error('--solution-limit (-l) must be an integer');
        }
        return arg;
      }
    })
    .option('floating', {
      alias: 'f',
      type: 'boolean',
      description: 'Allow for floating pieces.',
      default: false
    })
    .option('order', {
      alias: 'o',
      type: 'string',
      description: 'Given order of pieces to be placed.',
      default: '',
      coerce: (arg) => {
        if (!arg.match(/^[TILJSZO]*$/)) {
          throw new Error('--order (-o) must consist of only TILJSZO pieces');
        }
        return arg;
      }
    })
    .option('hold', {
      alias: 'd',
      type: 'number',
      description: 'Number of hold for handling order. Requires order to apply.',
      default: 0,
      coerce: (arg) => {
        if (!Number.isInteger(arg) && arg >= 0) {
          throw new Error('--hold (-h) must be nonnegative integer');
        }
        return arg;
      }
    })
    .option('srs', {
      alias: 's',
      type: 'boolean',
      description: 'Check if pieces are reachable through srs 180 kicktable.',
      default: false
    })
    .option('unglue', {
      alias: 'x',
      type: 'boolean',
      description: 'Unglues glued fumens. All other options are ignored if this is set.',
      default: false
    })
    .help()
    .alias('h', 'help');

  const argv = yargsInstance.parseSync();

  let input: string[] = [];

  // Read standard input
  const readStdin = (): Promise<string> => {
    return new Promise((resolve) => {
      let stdinData = '';
      process.stdin.on('data', (chunk: Buffer) => {
        stdinData += chunk.toString();
      });

      process.stdin.on('end', () => {
        resolve(stdinData);
      });

      process.stdin.resume();
    });
  };

  // Main function
  const main = async () => {
    const inputPromises: Promise<string>[] = [];

    if (!process.stdin.isTTY) {
      // Add stdin data if it's piped or redirected
      inputPromises.push(readStdin());
    }

    // Wait for all input sources to resolve and split by newline
    const inputs = await Promise.all(inputPromises);

    // Combine raw string argument and stdin and exclude empty strings and undefined
    input = [...argv._, ...inputs].filter(Boolean).join('\n').trim().split(/\s+/).filter(Boolean);

    if (input.length == 0) {
      yargsInstance.showHelp(); // show help
      process.exit(0);
    }

    if (argv.unglue) {
      console.log(input.map(unglueFumen).join('\n'));
      return;
    }

    // run glueFumen with all the input
    const order = argv.order ? argv.order : null;

    for (const fumen of input) {
      const gluedFumens = glueFumen(
        fumen,
        argv.solutionLimit,
        argv.floating,
        order,
        argv.hold,
        argv.srs
      );
      if (gluedFumens.length == 0) {
        console.log(`Warning: ${fumen} couldn't be glued`);
      }
      if (gluedFumens.length > 1) {
        console.log(`Warning: ${fumen} led to ${gluedFumens.length} outputs`);
      }
      console.log(gluedFumens.join('\n'));
    }
  };

  main().catch((err) => {
    console.error('Error:', err);
  });
}
