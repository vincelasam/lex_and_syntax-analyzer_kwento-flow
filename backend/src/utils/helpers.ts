// helper.ts

import { Token, TokenType } from "../types/Tokens";

/* =====================================================
   Character Classification Helpers
===================================================== */

/**
 * Checks if character is a letter (A–Z, a–z)
 */
export function isLetter(c: string): boolean {
  return /^[A-Za-z]$/.test(c);
}

/**
 * Checks if character is a digit (0–9)
 */
export function isDigit(c: string): boolean {
  return /^[0-9]$/.test(c);
}

/**
 * Checks if character is alphanumeric or underscore
 */
export function isAlphaNumeric(c: string): boolean {
  return isLetter(c) || isDigit(c) || c === "_";
}

/**
 * Checks if character is whitespace
 */
export function isWhitespace(c: string = ""): boolean {
  if (!c) return false;
  const code = c.charCodeAt(0);
  return code === 32 || (code >= 9 && code <= 13);
}

/* =====================================================
   Token Factory
===================================================== */

/**
 * Creates a token object
 */
export function makeToken(
  type: TokenType,
  lexeme: string,
  line: number,
  column: number
): Token {
  return { type, lexeme, line, column };
}

/* =====================================================
   Token Post-Processing
===================================================== */

/**
 * Removes comment tokens after lexing
 * (applied ONCE to the whole token list)
 */
export function removeComments(tokens: Token[]): Token[] {
  return tokens.filter(
    token =>
      token.type !== TokenType.SingleLineComment &&
      token.type !== TokenType.MultiLineComment
  );
}


//Nandito yung sinasabi mo pre para malaman if nasa dulo na ba ng file
//Pinaayos ko sa kay gpt

// ========== CharStream Class ==========
/**
 * Handles sequential reading of source code
 * while tracking line and column positions.
 */
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

  getLine(): number {
    return this.line;
  }

  getColumn(): number {
    return this.column;
  }
}

/* =====================================================
   Higher-Level Lexer Helpers
===================================================== */

/**
 * Reads characters while a condition holds true
 */
export function readWhile(
  stream: CharStream,
  condition: (c: string) => boolean
): string {
  let result = "";
  while (!stream.isEOF() && condition(stream.peek())) {
    result += stream.advance();
  }
  return result;
}

/**
 * Reads an identifier or keyword
 */
export function readIdentifier(stream: CharStream): string {
  return readWhile(stream, isAlphaNumeric);
}

/**
 * Reads a number literal
 */
export function readNumber(stream: CharStream): string {
  return readWhile(stream, isDigit);
}

/**
 * Reads a string literal (opening " already consumed)
 */
export function readString(stream: CharStream): string {
  let value = "";

  while (!stream.isEOF() && stream.peek() !== '"') {
    value += stream.advance();
  }

  if (stream.isEOF()) {
    throw new Error("Unterminated string literal");
  }

  stream.advance(); // consume closing quote
  return value;
}

/**
 * Determines whether a lexeme is a keyword or identifier
 */
export function keywordOrIdentifier(
  lexeme: string,
  keywords: Record<string, TokenType>
): TokenType {
  return keywords[lexeme] ?? TokenType.Identifier;
}
