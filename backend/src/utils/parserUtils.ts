import { Token, TokenType, KEYWORDS } from '../types/Tokens';
import { ErrorType, SyntaxError, SyntaxErrorBuilder } from '../parser/syntaxErr';

export class parserUtils {
  protected tokens: Token[];
  protected current: number = 0;
  protected errors: SyntaxError[] = [];
   
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  protected peek(): Token {
    return this.tokens[this.current];
  }

  protected previous(): Token {
    return this.tokens[this.current - 1];
  }

  protected isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  protected advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  protected check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  protected match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  protected consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    
    this.error(this.peek(), message, ErrorType.UNEXPECTED_TOKEN);
    throw new Error(message);
  }

  protected error(token: Token, message: string, type: ErrorType, suggestion?: string): void {
    this.errors.push({
      message,
      line: token.line,
      column: token.column,
      token: token.lexeme,
      type,
      suggestion
    });
  }

  protected expectSemicolon(): void {
    if (this.match(TokenType.D_Semicolon)) return;
  
    const err = SyntaxErrorBuilder.missingSemicolon(
      this.previous().line, 
      this.previous().column, 
      this.previous().lexeme
    );

    this.errors.push(err);
  }

 protected getKeywordSuggestion(typo: string): string | undefined {
    const validKeywords = Object.keys(KEYWORDS);
    let bestMatch: string | undefined;
    let minDistance = Infinity;

    // Convert typo to lowercase for case-insensitive comparison
    const typoLower = typo.toLowerCase();

    for (const keyword of validKeywords) {
      // Compare case-insensitively
      const dist = this.levenshtein(typoLower, keyword.toLowerCase());
      // More lenient threshold: distance < 3 OR distance < 50% of keyword length
      // This allows suggestions for longer keywords with more typos
      if (dist < 3 || (dist < keyword.length * 0.5 && dist <= Math.max(2, keyword.length / 2))) { 
        if (dist < minDistance) {
          minDistance = dist;
          bestMatch = keyword; // Return the original keyword (not lowercase)
        }
      }
    }
    return bestMatch;
  }

  private levenshtein(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) == a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  protected synchronize(): void {
    while (!this.isAtEnd()) {
      if (this.match(TokenType.D_Semicolon)) {
        return;
      }
      if (this.check(TokenType.D_RBrace)) {
        return;
      }

      switch (this.peek().type) {
        case TokenType.K_Scene:
        case TokenType.K_Character:
        case TokenType.K_When:
        case TokenType.K_Rem:
        case TokenType.K_Do:      
        case TokenType.K_Choose:
        case TokenType.K_Transition:
        case TokenType.K_Log:
        case TokenType.K_End:
        case TokenType.K_Perceives:
        case TokenType.K_Thru:
        case TokenType.R_Text:   
        case TokenType.R_Number:
        case TokenType.R_Boolean:
        case TokenType.R_DB:
          return;
      }

      this.advance();
    }
  }

  public getErrors(): SyntaxError[] {
    return this.errors;
  }
}