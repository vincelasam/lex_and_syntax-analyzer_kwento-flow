import { Token, TokenType } from '../types/Tokens';
// import { SyntaxError } from './SyntaxError';
// import { ProgramNode, ASTNode } from '../types/AST';

class Parser {
  private tokens: Token[];      // All the tokens from lexer
  private current: number = 0;  // Where you are in the list
  private errors: SyntaxError[] = []; // Errors you find

   
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }


}