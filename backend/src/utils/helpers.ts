// helper.ts

import { Token, TokenType } from "./Tokens";

//  Character Check functions

export function isLetter(c: string): boolean {
    return /^[A-Za-z]$/.test(c);
}

export function isDigit(c: string): boolean {
    return /^[0-9]$/.test(c);
}

export function isAlphaNumeric(c: string): boolean {
    return isLetter(c) || isDigit(c) || c === "_";
}

export function isWhitespace(c: string = ""): boolean {
    if (c.length === 0) return false;
    const code = c.charCodeAt(0);
    return code === 32 || (code >= 9 && code <= 13);
}


//Building Tokens

export function makeToken(
    type: TokenType,
    lexeme: string,
    line: number,
    column: number
): Token {
    return { type, lexeme, line, column };
}



//Ganto ba Vince??
export function removeComments(tokens: Token[]): Token[] {
    return tokens.filter(token =>
        token.type !== TokenType.SingleLineComment &&
        token.type !== TokenType.MultiLineComment
    );
}


//Nandito yung sinasabi mo pre para malaman if nasa dulo na ba ng file
//Pinaayos ko kay gpt

// ========== CharStream Class ==========
/**
 * a class for reading characters from the src
 * Maintains the current index, line, and column being scannded.
 */
export class CharStream {
    private src: string;
    private index = 0;
    private line = 1;
    private column = 1;

    constructor(src: string) {
        this.src = src;
    }

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

    getLine(): number {
        return this.line;
    }

    getColumn(): number {
        return this.column;
    }

    skipWhitespace(): void {
        while (isWhitespace(this.peek())) {
            this.advance();
        }
    }
}
