const CALL_SHAPES =
  'implementing("FR-007-AC-1") as a decorator, or implementing("FR-007-AC-1")(declaration) as a wrapper';

/** KIND, then hyphen-separated alphanumeric segments, one of which has a digit. */
const ID_SHAPE = /^[A-Za-z][A-Za-z0-9_]*((?:-[A-Za-z0-9]+)+)$/;

function describeType(value: unknown): string {
  return value === null ? "null" : typeof value;
}

function checkId(id: unknown, position: number): void {
  if (typeof id !== "string") {
    throw new TypeError(
      `implementing(): argument ${position} must be a string, got ${describeType(id)}`,
    );
  }
  const match = ID_SHAPE.exec(id);
  if (match === null || !/\d/.test(match[1])) {
    throw new TypeError(
      `implementing(): argument ${position} ${JSON.stringify(id)} is not an id-shaped string such as "FR-007-AC-1"`,
    );
  }
}

/** A function or a class constructor. */
type Callable =
  | ((...args: never[]) => unknown)
  | (abstract new (...args: never[]) => unknown);

/**
 * What `implementing(...)` returns: a decorator for a class, method, getter or
 * setter (standard or `experimentalDecorators`), and a wrapper that returns the
 * one argument it is given.
 */
export interface Implementing {
  /** Wrapper form, and a legacy class decorator. */
  <T extends Callable>(declaration: T, ...rest: never[]): T;
  /** Standard decorators: class, method, getter and setter. */
  (
    value: abstract new (...args: never[]) => unknown,
    context: ClassDecoratorContext,
  ): void;
  (
    value: (...args: never[]) => unknown,
    context:
      | ClassMethodDecoratorContext
      | ClassGetterDecoratorContext
      | ClassSetterDecoratorContext,
  ): void;
  /** `experimentalDecorators` member decorator; the descriptor is required. */
  (target: object, key: string | symbol, descriptor: PropertyDescriptor): void;
}

function mark(...args: unknown[]): unknown {
  if (args.length === 0) {
    throw new TypeError(
      `implementing(...) needs a declaration: ${CALL_SHAPES}`,
    );
  }
  return args.length === 1 ? args[0] : undefined;
}

/**
 * Declare the specification ids the marked class, method or function implements.
 * Each id is checked for shape when this is evaluated; the marked declaration is
 * returned unchanged.
 */
export function implementing(first: string, ...rest: string[]): Implementing {
  const ids: unknown[] = [first, ...rest];
  if (arguments.length === 0) {
    throw new TypeError(
      `implementing() needs at least one id, e.g. implementing("FR-007-AC-1")`,
    );
  }
  ids.forEach((id, index) => checkId(id, index + 1));
  return mark as Implementing;
}
