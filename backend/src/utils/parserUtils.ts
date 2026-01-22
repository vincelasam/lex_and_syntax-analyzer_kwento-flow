import { Token, TokenType } from '../types/Tokens';
import { SyntaxError } from '../parser/syntaxErr';


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
    
    this.error(this.peek(), message);
    throw new Error(message);
  }

  protected error(token: Token, message: string): void {
    this.errors.push({
      message,
      line: token.line,
      column: token.column,
      token: token.lexeme
    });
  }

  protected synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.D_Semicolon) return;

      switch (this.peek().type) {
        case TokenType.K_Scene:
        case TokenType.K_Character:
        case TokenType.K_When:
        case TokenType.K_Rem:
          return;
      }

      this.advance();
    }
  }

  public getErrors(): SyntaxError[] {
    return this.errors;
  }
}
