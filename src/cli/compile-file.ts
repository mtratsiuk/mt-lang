import { readLines } from "../lib/bufio.ts";

import { runParser } from "../core/parser-combinators.ts";
import { mtlang } from "../core/parser.ts";
import { compile } from "../core/compiler.ts";
import { print } from "../core/ast-printer.ts";
import { Expr } from "../core/ast.ts";
import { State } from "../core/parser-state.ts";

const printAstArg = Deno.args.includes("--ast");
const printStateArg = Deno.args.includes("--state");

const source = await readStdin();
const [ast, state] = runParser(source, mtlang);

if (!ast || state.errors.length !== 0) {
  console.log("Failed to parse source");

  if (ast) {
    printAst(ast);
  }

  console.log(state.errors);

  Deno.exit(1);
}

const result = compile(ast);

if (printAstArg) {
  printAst(ast);
}

if (printStateArg) {
  printState(state);
}

await Deno.stdout.write(new TextEncoder().encode(result));

export async function readStdin() {
  let input = "";

  for await (const line of readLines(Deno.stdin)) {
    input += line;
  }

  return input;
}

export function printAst(ast: Expr[]) {
  console.log("///");
  ast.map(print).forEach((x) => console.log(x));
  console.log("///");
}

export function printState(state: State) {
  console.log("+++");
  console.log(state);
  console.log("+++");
}
