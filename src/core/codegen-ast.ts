enum T {
  Expr = "Expr",
  String = "string",
  Number = "number",
  Boolean = "boolean",
}

type Ast = {
  [base: string]: {
    name: string;
    params: [string, T][];
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
        accept<T>(visitor: ${Base}Visitor<T>): T {
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

const defineBinOpExpr = (name: string) =>
  defineExpr(name, ["left", T.Expr], ["right", T.Expr]);

defineLitExpr("NumLit", T.Number);
defineLitExpr("StrLit", T.String);
defineLitExpr("BoolLit", T.Boolean);

defineExpr("UnaryNotOp", ["value", T.Expr]);
defineExpr("UnaryMinusOp", ["value", T.Expr]);

defineExpr("Grouping", ["expr", T.Expr]);

defineBinOpExpr("BinPlusOp");
defineBinOpExpr("BinMinusOp");
defineBinOpExpr("BinMultOp");
defineBinOpExpr("BinDivOp");
defineBinOpExpr("BinMoreThanOp");
defineBinOpExpr("BinMoreThanOrEqOp");
defineBinOpExpr("BinLessThanOp");
defineBinOpExpr("BinLessThanOrEqOp");
defineBinOpExpr("BinEqOp");
defineBinOpExpr("BinNotEqOp");

function main() {
  Deno.writeTextFileSync(Deno.args[0], generateAst(ast));
}

main();
