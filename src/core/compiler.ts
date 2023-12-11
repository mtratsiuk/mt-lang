import { pass } from "../utils/mod.ts";

import * as Ast from "./ast.ts";
import { BinaryOps, UnaryOps } from "./keywords.ts";

export enum Utils {
  CURRY = "__mtl_curry",
}

const INLINED_UTILS = `\
const ${Utils.CURRY} = f => (...args) => {
  if (args.length >= f.length) {
    return f(...args);
  }

  return ${Utils.CURRY}(f.bind(null, ...args));
};

`;

const IDENT = 2;

export type Compile = (value: Ast.Expr | Ast.Expr[]) => string;
export const compile: Compile = (value) => {
  if (!Array.isArray(value)) {
    value = [value];
  }

  return INLINED_UTILS + value.map(Compiler.compile).join(";\n\n") + ";";
};

export class Compiler implements Ast.ExprVisitor<string> {
  _depth = 0;

  static compile(value: Ast.Expr): string {
    return value.accept(new Compiler());
  }

  compile = (value: Ast.Expr): string => {
    return value.accept(this);
  };

  visitParseError = pass;

  visitNumLit({ value }: Ast.NumLit): string {
    return String(value);
  }

  visitStrLit({ value }: Ast.StrLit): string {
    return `"${value}"`;
  }

  visitBoolLit({ value }: Ast.BoolLit): string {
    return String(value);
  }

  visitNilLit(): string {
    return "null";
  }

  visitArrayLit({ items }: Ast.ArrayLit): string {
    return `[${items.map(this.compile).join(", ")}]`;
  }

  visitIdentifier({ name }: Ast.Identifier): string {
    return name;
  }

  visitCall({ callee, args }: Ast.Call): string {
    return `${this.compile(callee)}(${args.map(this.compile).join(", ")})`;
  }

  visitMethodCallChain({ receiver, calls }: Ast.MethodCallChain): string {
    return `${this.compile(receiver)}${
      calls
        .map(({ target, args }) => {
          const keyString = this.compile(target);
          const accessor = target instanceof Ast.Identifier
            ? `.${keyString}`
            : `[${keyString}]`;

          return `${accessor}(${args.map(this.compile).join(", ")})`;
        })
        .join("")
    }`;
  }

  visitPrint({ value }: Ast.Print): string {
    return `console.log(String(${this.compile(value)}))`;
  }

  visitUnaryOp({ op, value }: Ast.UnaryOp): string {
    return `${UnaryOps[op]}${this.compile(value)}`;
  }

  visitBinaryOp({ op, left, right }: Ast.BinaryOp): string {
    return `(${this.compile(left)} ${BinaryOps[op]} ${this.compile(right)})`;
  }

  visitVariableDecl({ name, value }: Ast.VariableDecl): string {
    return `const ${name} = ${this.compile(value)}`;
  }

  visitFunctionExpr({ params, body }: Ast.FunctionExpr): string {
    return `${params.length > 1 ? Utils.CURRY : ""}((${params.join(", ")}) => ${
      this.compile(body)
    })`;
  }

  visitMember({ target, key }: Ast.Member): string {
    const keyString = this.compile(key);
    const accessor = key instanceof Ast.Identifier
      ? `.${keyString}`
      : `[${keyString}]`;

    return `${this.compile(target)}${accessor}`;
  }

  visitCond({ branches, elseBody }: Ast.Cond): string {
    const [first, ...rest] = branches;

    // deno-fmt-ignore
    return this._withIdent((ident, prevIdent) => {
      return `\
(() => {\
${ident}if (${this.compile(first.condition)}) ${this.compile(first.body)}\
${rest.map((branch) => ` else if (${this.compile(branch.condition)}) ${this.compile(branch.body)}`).join("")}\
${!elseBody ? "" : ` else ${this.compile(elseBody)}`}\
${prevIdent}})()`;
    });
  }

  visitBlock({ body }: Ast.Block): string {
    return this._withIdent((ident, prevIdent) => {
      return `\
{\
${body.slice(0, -1).map((expr) => `${ident}${this.compile(expr)};`).join("")}\
${body.slice(-1).map((expr) => `${ident}return ${this.compile(expr)};`)}\
${prevIdent}}`;
    });
  }

  _withIdent(compile: (ident: string, prevIdent: string) => string): string {
    try {
      this._depth += 1;

      return compile(
        "\n" + " ".repeat(IDENT * this._depth),
        "\n" + " ".repeat(IDENT * Math.max(this._depth - 1, 0)),
      );
    } finally {
      this._depth -= 1;
    }
  }
}
