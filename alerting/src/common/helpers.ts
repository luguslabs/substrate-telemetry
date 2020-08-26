import { Milliseconds, Timestamp } from "./types";

/**
 * PhantomData akin to Rust, because sometimes you need to be smarter than
 * the compiler.
 */
export abstract class PhantomData<P> {
  public __PHANTOM__: P;
}

/**
 * Opaque type, similar to `opaque type` in Flow, or new types in Rust/C.
 * These should be produced only by manually casting `t as Opaque<T, P>`.
 *
 * `P` can be anything as it's never actually used. Using strings is okay:
 *
 * ```
 * type MyType = Opaque<number, 'MyType'>;
 * ```
 */
export type Opaque<T, P> = T & PhantomData<P>;

/**
 * Just a readable shorthand for null-ish-able types, akin to `T?` in Flow.
 */
export type Maybe<T> = T | null | undefined;

/**
 * Asynchronous sleep
 */
export function sleep(time: Milliseconds): Promise<void> {
  return new Promise<void>((resolve, _reject) => {
    setTimeout(() => resolve(), time);
  });
}

export const timestamp = Date.now as () => Timestamp;

export function noop() {}

/**
 * Keep track of last N numbers pushed onto internal stack.
 * Provides means to get an average of said numbers.
 */
export class NumStats<T extends number> {
  private readonly stack: Array<T>;
  private readonly history: number;
  private index = 0;

  constructor(history: number) {
    if (history < 1) {
      throw new Error("Must track at least one number");
    }

    this.history = history;
    this.stack = new Array(history);
  }

  public push(val: T) {
    this.stack[this.index++ % this.history] = val;
  }

  /**
   * Get average value of all values on the stack.
   *
   * @return {T} average value
   */
  public average(): T {
    if (this.index === 0) {
      return 0 as T;
    }

    const list = this.nonEmpty();
    let sum = 0;

    for (const n of list as Array<number>) {
      sum += n;
    }

    return (sum / list.length) as T;
  }

  private nonEmpty(): Readonly<Array<number>> {
    return this.index < this.history
      ? this.stack.slice(0, this.index)
      : this.stack;
  }
}
