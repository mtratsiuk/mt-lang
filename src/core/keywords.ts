export const Keywords = {
  DEFINE: "def",
  AND: "and",
  OR: "or",
  PRINT: "print",
  CONDITION: "cond",
  ELSE: "else",
  NIL: "nil",
};

const keywords = new Set(Object.values(Keywords));

export type IsKeyword = (s: string) => boolean;
export const isKeyword: IsKeyword = (s) => keywords.has(s);

export const BinaryOps: Record<string, string> = {
  "+": "+",
  "-": "-",
  "*": "*",
  "/": "/",
  "&": "&",
  "|": "|",
  "^": "^",
  "=": "===",
  "<=": "<=",
  "<": "<",
  ">=": ">=",
  ">": ">",
  "<<": "<<",
  ">>": ">>",
  ">>>": ">>>",
  [Keywords.OR]: "||",
  [Keywords.AND]: "&&",
};

export const binaryOps = Object.keys(BinaryOps);

export const UnaryOps: Record<string, string> = {
  "!": "!",
  "-": "-",
  "~": "~",
};

export const unaryOps = Object.keys(UnaryOps);
