"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var glueFumen_1 = __importDefault(require("./glueFumen"));
var yargs_1 = __importDefault(require("yargs"));
var helpers_1 = require("yargs/helpers");
if (require.main == module) {
    var yargsInstance_1 = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
        .version(false)
        .usage("Usage: glueFumen.js [fumens...] [options] [< inputFile]\n\nTurns single page fumens with color coded pieces into multipage fumens with a piece on each page.")
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
        coerce: function (arg) {
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
        .help();
    var argv_1 = yargsInstance_1.parseSync();
    var input_1 = [];
    // Read standard input
    var readStdin_1 = function () {
        return new Promise(function (resolve) {
            var stdinData = "";
            process.stdin.on("data", function (chunk) {
                stdinData += chunk.toString();
            });
            process.stdin.on("end", function () {
                resolve(stdinData);
            });
            process.stdin.resume();
        });
    };
    // Main function
    var main = function () { return __awaiter(void 0, void 0, void 0, function () {
        var inputPromises, inputs, allFumens;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    inputPromises = [];
                    if (!process.stdin.isTTY) {
                        // Add stdin data if it's piped or redirected
                        inputPromises.push(readStdin_1());
                    }
                    return [4 /*yield*/, Promise.all(inputPromises)];
                case 1:
                    inputs = _a.sent();
                    // Combine raw string argument and stdin and exclude empty strings and undefined
                    input_1 = __spreadArray(__spreadArray([], argv_1._, true), inputs, true).filter(Boolean).join('\n').trim().split(/\s+/).filter(Boolean);
                    if (input_1.length == 0) {
                        yargsInstance_1.showHelp(); // show help
                        process.exit(0);
                    }
                    console.log(argv_1["fast"], argv_1["expected-solutions"], argv_1["visualize"]);
                    allFumens = (0, glueFumen_1.default)(input_1, argv_1.fast, argv_1.expectedSolutions, argv_1.visualize);
                    console.log(allFumens.join("\n"));
                    return [2 /*return*/];
            }
        });
    }); };
    main().catch(function (err) {
        console.error("Error:", err.message);
    });
}
