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

/** The title literal of the call whose `(` is at `open`, if it is a plain literal. */
function titleAfterParen(source: string, open: number): string {
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

const DECODED: Record<string, string> = { n: "\n", t: "\t", r: "\r" };

/** Could `raw` (a title as written in source) have produced the run title `name`? */
function consistent(raw: string, name: string): boolean {
  const decoded = raw.replace(/\\(.)/gs, (_, c: string) => DECODED[c] ?? c);
  const parts = decoded.split(/%[sdifjoOpc#]|%%|\$\{[^}]*\}|\$[\w.]+/);
  const escaped = parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`^${escaped.join(".*")}$`, "s").test(name);
}

/** Every title literal passed to a curried call (`x.each(...)(title` or a tagged template). */
function curriedTitles(source: string): string[] {
  const found: string[] = [];
  for (const m of source.matchAll(/[)`]\s*\(/g)) {
    try {
      found.push(titleAfterParen(source, m.index + m[0].length - 1));
    } catch (error) {
      if (!(error instanceof TemplateNotRecovered)) throw error;
    }
  }
  return found;
}

/**
 * Recover a test's title as written in source: the raw text between the quotes,
 * escapes not decoded, which is what `quire coverage --json` reports. `line` and
 * `column` are the registration's location, which names the call that takes the
 * title. For a multi-line tagged template vitest's location can be wrong, so for
 * `each` registrations the curried-call titles in the file are the fallback. A
 * candidate is accepted only if it could have produced the run title `name`, and
 * a fallback only if exactly one distinct title could have. Throws
 * `TemplateNotRecovered` when there is none, or more than one.
 */
export function recoverTitle(
  source: string,
  line: number,
  column: number,
  name: string,
  each: boolean,
): string {
  const offset = offsetOf(source, line, column);
  const direct = (): string => {
    const open = source.indexOf("(", offset);
    if (open === -1) throw new TemplateNotRecovered("no call found");
    if (each && open !== offset) {
      // Vitest places an accurate `each` location exactly on the title's call.
      throw new TemplateNotRecovered("the location is not at the title call");
    }
    return titleAfterParen(source, open);
  };
  let failure: TemplateNotRecovered | undefined;
  try {
    const raw = direct();
    if (consistent(raw, name)) return raw;
    failure = new TemplateNotRecovered(
      "the title read at the location does not match the run title",
    );
  } catch (error) {
    if (!(error instanceof TemplateNotRecovered)) throw error;
    failure = error;
  }
  if (each) {
    const fits = [
      ...new Set(curriedTitles(source).filter((r) => consistent(r, name))),
    ];
    if (fits.length === 1) return fits[0];
    if (fits.length > 1) {
      throw new TemplateNotRecovered(
        `the registration location is unreliable and ${fits.length} titles could be it (${fits.map((f) => `"${f}"`).join(", ")})`,
      );
    }
  }
  throw failure;
}
