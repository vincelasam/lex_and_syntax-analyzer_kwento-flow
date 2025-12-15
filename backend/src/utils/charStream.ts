import { isWhitespace } from "./helpers";

export class CharStream {
  private index = 0;
  private line = 1;
  private column = 1;

  constructor(private src: string) {}

  peek(): string {
    return this.src[this.index] ?? "\0";
  }

  peekNext(): string {
    return this.src[this.index + 1] ?? "\0";
  }

  advance(): string {
    const ch = this.src[this.index++] ?? "\0";
    if (ch === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  match(expected: string): boolean {
    if (this.peek() === expected) {
      this.advance();
      return true;
    }
    return false;
  }

  isEOF(): boolean {
    return this.index >= this.src.length;
  }

  skipWhitespace(): void {
    while (!this.isEOF() && isWhitespace(this.peek())) {
      this.advance();
    }
  }

  getLine(): number { return this.line; }
  getColumn(): number { return this.column; }
}