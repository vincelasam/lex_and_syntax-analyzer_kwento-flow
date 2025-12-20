/* =====================================================
   Character Classification Helpers
===================================================== */

import { CharStream } from "./charStream";

export function isLetter(c: string): boolean {
  return /^[A-Za-z]$/.test(c);
}

export function isDigit(c: string): boolean {
  return /^[0-9]$/.test(c);
}

export function isAlphaNumeric(c: string): boolean {
  return isLetter(c) || isDigit(c);
}

export function isWhitespace(c: string = ""): boolean {
  if (!c) return false;
  const code = c.charCodeAt(0);
  return code === 32 || (code >= 9 && code <= 13);
}

export function isOperatorChar(ch: string): boolean {
        return ch === '+' || ch === '-' || ch === '*' || ch === '/' || 
        ch === '%' || ch === '^' || ch === '=' || ch === '!' ||
        ch === '<' || ch === '>' || ch === '&' || ch === '|';
}

export function isDelimiterChar(ch: string): boolean {
    return ch === '(' || ch === ')' || ch === '{' || ch === '}' ||
           ch === '[' || ch === ']' || ch === ':' || ch === ';' ||
           ch === ',' || ch === '.';
}

export function readWhile(stream: CharStream, condition: (c: string) => boolean): string {
  let result = "";
  while (!stream.isEOF() && condition(stream.peek())) {
    result += stream.advance();
  }
  return result;
}

export function readIdentifier(stream: CharStream): string {
  return readWhile(stream, isAlphaNumeric);
}

export function readNumber(stream: CharStream): string {
  return readWhile(stream, isDigit);
}

export function readString(stream: CharStream): string {
  let value = "";
  while (!stream.isEOF() && stream.peek() !== '"') {
    const ch = stream.peek();

    if (ch == "\\"){
      stream.advance();

      if (stream.isEOF()) {
      throw new Error("Unterminated string literal");
    }

    const nextChar = stream.peek();
      
      switch (nextChar) {
        case 'n':
          value += '\n'; // actual newline character
          stream.advance();
          break;
        case 't':
          value += '\t'; // actual tab character
          stream.advance();
          break;
        case '\\':
          value += '\\'; // literal backslash
          stream.advance();
          break;
        case '"':
          value += '"'; // literal quote
          stream.advance();
          break;
        default:
          // Invalid escape sequence - treat as error
          while (!stream.isEOF() && stream.peek() !== '"') {
            stream.advance();
          }
          if (!stream.isEOF()) {
            stream.advance(); // consume closing quote
          }
          throw new Error(`Invalid escape sequence: \\${nextChar}`);
      }
    } else {
      value += stream.advance();
    }
  }
  
  if (stream.isEOF()) {
    throw new Error("Unterminated string literal");
  }
  
  stream.advance(); // consume closing quote
  return value;
}
