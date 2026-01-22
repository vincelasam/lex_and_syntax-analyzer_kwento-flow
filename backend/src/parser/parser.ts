import { Token, TokenType } from '../types/Tokens';
import { parserUtils } from '../utils/parserUtils';
/*import { 
  ASTNode, 
  ProgramNode, 
  SceneDeclaration,
  Statement,
  VariableDeclaration,
  Expression
} from '../types/AST';*/

export class Parser extends parserUtils {
  constructor(tokens: Token[]) {
    super(tokens);  
  }


  /* public parse(): { body: ASTNode[], errors: any[] } {
    const nodes: ASTNode[] = [];

    try {
      // Parse story declaration (optional)
      if (this.match(TokenType.K_Story)) {
        nodes.push(this.storyDeclaration());
      }

      // Parse scenes
      while (!this.isAtEnd()) {
        if (this.match(TokenType.K_Scene)) {
          nodes.push(this.sceneDeclaration());
        } else if (!this.isAtEnd()) {
          this.error(this.peek(), 'Expected scene declaration');
          this.advance();
        }
      }
    } catch (error) {
      // Errors already recorded
    }

    return {
      body: nodes,
      errors: this.errors
    };
  }

  // ===== GRAMMAR RULES =====

  private storyDeclaration(): any {
    const name = this.consume(TokenType.Identifier, 'Expected story name');
    return {
      type: 'StoryDeclaration',
      name: name.lexeme
    };
  }

   private sceneDeclaration(): SceneDeclaration {
    const name = this.consume(TokenType.Identifier, 'Expected scene name');
    this.consume(TokenType.D_LBrace, 'Expected "{" after scene name');
    
    const body = this.statementList();
    
    this.consume(TokenType.D_RBrace, 'Expected "}" to close scene');
    
    return {
      type: 'SceneDeclaration',
      name: name.lexeme,
      body
    };
  }

  private statementList(): Statement[] {
    const statements: Statement[] = [];
    
    while (!this.check(TokenType.D_RBrace) && !this.isAtEnd()) {
      try {
        statements.push(this.statement());
      } catch (error) {
        this.synchronize();
      }
    }
    
    return statements;
  }

  private statement(): Statement {
    // Variable declaration: text x;
    if (this.match(TokenType.R_Text, TokenType.R_Number, TokenType.R_Boolean)) {
      return this.varDeclaration(this.previous().type);
    }

    // Assignment: rem x = 10;
    if (this.match(TokenType.K_Rem)) {
      return this.assignment();
    }

    this.error(this.peek(), 'Invalid statement');
    throw new Error('Invalid statement');
  }

  private varDeclaration(dataType: TokenType): VariableDeclaration {
    const name = this.consume(TokenType.Identifier, 'Expected variable name');
    this.consume(TokenType.D_Semicolon, 'Expected ";" after variable declaration');
    
    return {
      type: 'VariableDeclaration',
      dataType: TokenType[dataType],
      name: name.lexeme
    };
  }

  private assignment(): any {
    const name = this.consume(TokenType.Identifier, 'Expected variable name');
    this.consume(TokenType.OP_Assign, 'Expected "=" in assignment');
    const value = this.expression();
    this.consume(TokenType.D_Semicolon, 'Expected ";" after assignment');
    
    return {
      type: 'Assignment',
      name: name.lexeme,
      value
    };
  }

  private expression(): Expression {
    // Simple for now - just literals and identifiers
    if (this.match(TokenType.NumberLiteral)) {
      return { type: 'Literal', value: this.previous().lexeme };
    }

    if (this.match(TokenType.TextLiteral)) {
      return { type: 'Literal', value: this.previous().lexeme };
    }

    if (this.match(TokenType.Identifier)) {
      return { type: 'Identifier', name: this.previous().lexeme };
    }

    this.error(this.peek(), 'Expected expression');
    throw new Error('Expected expression');
  }
    */
}