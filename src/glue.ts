import glueFumen from './lib/glueFumen';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as path from 'path';

if(require.main == module) {
    const yargsInstance = yargs(hideBin(process.argv))
        .version(false)
        .usage(`\nUsage: ${path.basename(__filename)} [fumens...] [options] [< inputFile]\n\nTurns single page fumens with color coded pieces into multipage fumens with a piece on each page.`)
        .option('fast', {
            alias: 'f',
            type: 'boolean',
            description: 'Runs a faster version but may miss solutions',
            default: false
        })
        .option('expected-solutions', {
            alias: 'e',
            type: 'number',
            description: 'Number of expected solutions for each of the fumens. Stops once the number of expected solutions is found.',
            default: -1,
            coerce: (arg) => {
                if (!Number.isInteger(arg)) {
                    throw new Error('--expected-solutions (-e) must be an integer');
                }
                return arg;
            },
        })
        .option('visualize', {
            alias: 'v',
            type: 'boolean',
            description: 'Visualization of what the script is doing to find solutions.',
            default: false
        })
        .help()
        .alias('h', 'help');

    const argv = yargsInstance.parseSync();

    let input: string[] = [];

    // Read standard input
    const readStdin = (): Promise<string> => {
      return new Promise((resolve) => {
        let stdinData = "";
        process.stdin.on("data", (chunk: Buffer) => {
          stdinData += chunk.toString();
        });

        process.stdin.on("end", () => {
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

        if(input.length == 0) {
            yargsInstance.showHelp(); // show help
            process.exit(0);
        }

        // Run glue
        let allFumens = glueFumen(input, argv.fast, argv.expectedSolutions, argv.visualize);
        console.log(allFumens.join("\n"));
    };

    main().catch((err) => {
      console.error("Error:", err.message);
    });
}

