/** Why a title could not be read from source. */
export class TemplateNotRecovered extends Error {}

const ESCAPES: Record<string, string> = {
  n: "\n",
  t: "\t",
  r: "\r",
  b: "\b",
  f: "\f",
  v: "\v",
  "0": "\0",
};

function offsetOf(source: string, line: number, column: number): number {
  let offset = 0;
  for (let l = 1; l < line; l++) {
    const next = source.indexOf("\n", offset);
    if (next === -1) return source.length;
    offset = next + 1;
  }
  return offset + column - 1;
}

/** Index of the `(` matching the `)` at `close`, scanning backwards. */
function matchingOpen(source: string, close: number): number {
  let depth = 0;
  for (let i = close; i >= 0; i--) {
    const c = source[i];
    if (c === ")") depth++;
    else if (c === "(") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** True when the call whose argument list opens at `open` is `x.each(...)(` or `x.each\`...\`(`. */
function followsEach(source: string, open: number): boolean {
  let i = open - 1;
  while (i >= 0 && /\s/.test(source[i])) i--;
  if (i < 0) return false;
  if (source[i] === "`") return true;
  if (source[i] !== ")") return false;
  const calleeOpen = matchingOpen(source, i);
  if (calleeOpen < 0) return false;
  const before = source.slice(0, calleeOpen).trimEnd();
  const name = /([A-Za-z_$][\w$]*)$/.exec(before)?.[1];
  return name === "each" || name === "for";
}

/** Read the string literal that starts at `start`; return its value and end index. */
function readLiteral(source: string, start: number): [string, number] {
  const quote = source[start];
  if (quote !== '"' && quote !== "'" && quote !== "`") {
    throw new TemplateNotRecovered("the title is not a string literal");
  }
  let value = "";
  for (let i = start + 1; i < source.length; i++) {
    const c = source[i];
    if (c === quote) return [value, i + 1];
    if (quote === "`" && c === "$" && source[i + 1] === "{") {
      throw new TemplateNotRecovered(
        "the title template interpolates an expression",
      );
    }
    if (c === "\\") {
      const next = source[++i];
      value += ESCAPES[next] ?? next;
    } else if (c === "\n" && quote !== "`") {
      break;
    } else {
      value += c;
    }
  }
  throw new TemplateNotRecovered("the title literal is not terminated");
}

/**
 * Recover the literal template title of an `it.each`/`test.each` registration
 * from source text at the registration's location. Returns `undefined` when the
 * registration is not an `each` form (the registered title is then the symbol).
 * Throws `TemplateNotRecovered` for an `each` whose title is not a plain literal.
 */
export function recoverEachTemplate(
  source: string,
  line: number,
  column: number,
): string | undefined {
  const open = source.indexOf("(", offsetOf(source, line, column));
  if (open === -1) return undefined;
  if (!followsEach(source, open)) return undefined;
  let i = open + 1;
  while (i < source.length && /\s/.test(source[i])) i++;
  const [value, end] = readLiteral(source, i);
  let j = end;
  while (j < source.length && /\s/.test(source[j])) j++;
  if (source[j] !== "," && source[j] !== ")") {
    throw new TemplateNotRecovered("the title is built from an expression");
  }
  return value;
}
