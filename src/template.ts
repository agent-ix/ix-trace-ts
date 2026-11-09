/** Why a title could not be read from source. */
export class TemplateNotRecovered extends Error {}

function offsetOf(source: string, line: number, column: number): number {
  let offset = 0;
  for (let l = 1; l < line; l++) {
    const next = source.indexOf("\n", offset);
    if (next === -1) return source.length;
    offset = next + 1;
  }
  return offset + column - 1;
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
      value += c + source[++i];
    } else if (c === "\n" && quote !== "`") {
      break;
    } else {
      value += c;
    }
  }
  throw new TemplateNotRecovered("the title literal is not terminated");
}

/**
 * Recover the template title of an `it.each`/`test.each` registration as it is
 * written in source (raw text between the quotes, escapes not decoded), which is
 * what `quire coverage --json` reports. `line` and `column` are the
 * registration's location, which vitest places at the call that takes the title.
 * Throws `TemplateNotRecovered` when the title is not a plain literal.
 */
export function recoverEachTemplate(
  source: string,
  line: number,
  column: number,
): string {
  const open = source.indexOf("(", offsetOf(source, line, column));
  if (open === -1) {
    throw new TemplateNotRecovered(
      "no call found at the registration location",
    );
  }
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
