import { Token, TokenType } from "../types/Tokens"; 
/* =====================================================
   Token Factory
===================================================== */

export function makeToken(
  type: TokenType,
  lexeme: string,
  line: number,
  column: number
): Token {
  return { type, lexeme, line, column };
}

/* =====================================================
   Token Identification
===================================================== */

/**
 * Determines whether a lexeme is a keyword or identifier
 */
export function keywordOrIdentifier(
  lexeme: string,
  keywords: Record<string, TokenType>
): TokenType {
  return keywords[lexeme] ?? TokenType.Identifier;
}

/* =====================================================
   Token Array Filters (Post-Processing)
===================================================== */

export function removeComments(tokens: Token[]): Token[] {
  return tokens.filter(
    token =>
      token.type !== TokenType.SingleLineComment &&
      token.type !== TokenType.MultiLineComment
  );
}

export function removeWhitespace(tokens: Token[]): Token[] {
    return tokens.filter(t => t.type !== TokenType.Whitespace);
}

export function removeNoiseWords(tokens: Token[]): Token[] {
    return tokens.filter(t => t.type !== TokenType.N_Noiseword);
}

export function getTokensByType(tokens: Token[], type: TokenType): Token[] {
    return tokens.filter(t => t.type === type);
}

/* =====================================================
   Error Handling & Debugging
===================================================== */

export function hasErrors(tokens: Token[]): boolean {
    return tokens.some(t => t.type === TokenType.Error);
}

export function getErrors(tokens: Token[]): Token[] {
    return tokens.filter(t => t.type === TokenType.Error);
}

export function prettyPrintTokens(tokens: Token[]): string {
    return tokens.map(t => 
        `Line ${t.line}, Col ${t.column}: ${t.type} "${t.lexeme}"`
    ).join('\n');
}