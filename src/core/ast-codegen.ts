enum T {
  Expr = "Expr",
  String = "string",
  Number = "number",
  Boolean = "boolean",
}

type ArrayType = (t: T) => `${typeof t}[]`;
const arrayType: ArrayType = (t) => `${t}[]`;

type Ast = {
  [base: string]: {
    name: string;
    params: [string, T | ReturnType<ArrayType>][];
  }[];
};

const ast: Ast = {
  Expr: [],
};

const generateAst = (ast: Ast) => {
  let code = "/* Generated code */";

  for (const [Base, Nodes] of Object.entries(ast)) {
    code += "\n\n";

    code += `
      export type ${Base}Visitor<T> = {
        ${Nodes.map(({ name }) => `visit${name}(value: ${name}): T`).join("\n")}
      }\n\n
    `;

    code += `
      export class Expr {
        accept<T>(_visitor: ${Base}Visitor<T>): T {
          throw new Error("not implemented")
        }
      }\n\n
    `;

    for (const { name, params } of Nodes) {
      code += `
        export class ${name} extends ${Base} {
          constructor(${
        params.map(([name, type]) => `public ${name}: ${type}`).join(", ")
      }) {
            super()
          }

          accept<T>(visitor: ${Base}Visitor<T>): T {
            return visitor.visit${name}(this)
          }
        }\n\n
      `;
    }
  }

  return code;
};

const defineExpr = (name: string, ...params: Ast["Expr"][0]["params"]) => {
  ast.Expr.push({ name, params });
};

const defineLitExpr = (name: string, type: T) =>
  defineExpr(name, ["value", type]);

defineLitExpr("NumLit", T.Number);
defineLitExpr("StrLit", T.String);
defineLitExpr("BoolLit", T.Boolean);

defineExpr("Identifier", ["name", T.String]);

defineExpr("Call", ["callee", T.Expr], ["args", arrayType(T.Expr)]);

defineExpr("UnaryNotOp", ["value", T.Expr]);
defineExpr("UnaryMinusOp", ["value", T.Expr]);

defineExpr("ParseError", ["message", T.String]);

defineExpr("VariableDecl", ["name", T.String], ["value", T.Expr]);

defineExpr(
  "FunctionDecl",
  ["name", T.String],
  ["params", arrayType(T.String)],
  ["body", arrayType(T.Expr)],
);

function main() {
  Deno.writeTextFileSync(Deno.args[0], generateAst(ast));
}

main();
