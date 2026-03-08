export type Token =
  | Readonly<{ type: "eq" }>
  | Readonly<{ type: "number"; value: number }>
  | Readonly<{ type: "ident"; value: string }>
  | Readonly<{ type: "cell"; col: string; row: number }>
  | Readonly<{ type: "colon" }>
  | Readonly<{ type: "comma" }>
  | Readonly<{ type: "lparen" }>
  | Readonly<{ type: "rparen" }>
  | Readonly<{ type: "op"; value: "+" | "-" | "*" | "/" }>
  | Readonly<{ type: "eof" }>;

export class FormulaTokenizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaTokenizeError";
  }
}

function isDigit(c: string) {
  return c >= "0" && c <= "9";
}

function isAlpha(c: string) {
  const u = c.toUpperCase();
  return u >= "A" && u <= "Z";
}

function isAlphaNum(c: string) {
  return isAlpha(c) || isDigit(c);
}

export function tokenizeFormula(input: string): Token[] {
  const s = input.trim();
  const tokens: Token[] = [];
  let i = 0;

  if (!s.startsWith("=")) {
    throw new FormulaTokenizeError('Formula must start with "="');
  }
  tokens.push({ type: "eq" });
  i = 1;

  while (i < s.length) {
    const c = s[i];

    // whitespace
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }

    // operators
    if (c === "+" || c === "-" || c === "*" || c === "/") {
      tokens.push({ type: "op", value: c });
      i++;
      continue;
    }

    // punctuation
    if (c === "(") {
      tokens.push({ type: "lparen" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ type: "rparen" });
      i++;
      continue;
    }
    if (c === ":") {
      tokens.push({ type: "colon" });
      i++;
      continue;
    }
    if (c === ",") {
      tokens.push({ type: "comma" });
      i++;
      continue;
    }

    // number
    if (isDigit(c) || (c === "." && i + 1 < s.length && isDigit(s[i + 1]!))) {
      const start = i;
      i++;
      while (i < s.length && (isDigit(s[i]!) || s[i] === ".")) i++;
      const raw = s.slice(start, i);
      const n = Number(raw);
      if (!Number.isFinite(n)) throw new FormulaTokenizeError(`Invalid number: ${raw}`);
      tokens.push({ type: "number", value: n });
      continue;
    }

    // identifier or cell ref
    if (isAlpha(c)) {
      const start = i;
      i++;
      while (i < s.length && isAlpha(s[i]!)) i++;
      const letters = s.slice(start, i).toUpperCase();

      // If immediately followed by digits => cell ref
      let j = i;
      while (j < s.length && isDigit(s[j]!)) j++;
      if (j > i) {
        const rowDigits = s.slice(i, j);
        const row = Number(rowDigits);
        if (!Number.isInteger(row) || row <= 0) {
          throw new FormulaTokenizeError(`Invalid row number in reference: ${letters}${rowDigits}`);
        }
        tokens.push({ type: "cell", col: letters, row });
        i = j;
        continue;
      }

      // else identifier (function names like SUM)
      // allow alphanum in identifiers beyond first chunk
      while (i < s.length && isAlphaNum(s[i]!)) i++;
      const ident = s.slice(start, i).toUpperCase();
      tokens.push({ type: "ident", value: ident });
      continue;
    }

    throw new FormulaTokenizeError(`Unexpected character "${c}" at position ${i}`);
  }

  tokens.push({ type: "eof" });
  return tokens;
}