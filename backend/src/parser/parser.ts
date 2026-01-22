import { Token, TokenType } from '../types/Tokens';
import { parserUtils } from '../utils/parserUtils';
import { ASTNode, SceneDeclaration, Statement, VariableDeclaration, Expression } from '../types/AST';

export class Parser extends parserUtils {
  constructor(tokens: Token[]) {
    super(tokens);  
  }

  public parse(): { body: ASTNode[], errors: any[] } {
    const nodes: ASTNode[] = [];

    try {
      if (this.match(TokenType.K_Story)) {
        nodes.push(this.storyDeclaration());
      }

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

    return { body: nodes, errors: this.errors };
  }

  private storyDeclaration(): any {
    const name = this.consume(TokenType.Identifier, 'Expected story name');
    return { type: 'StoryDeclaration', name: name.lexeme };
  }

  private sceneDeclaration(): SceneDeclaration {
    const name = this.consume(TokenType.Identifier, 'Expected scene name');
    this.consume(TokenType.D_LBrace, 'Expected "{" after scene name');
    
    const body = this.statementList();
    this.consume(TokenType.D_RBrace, 'Expected "}" to close scene');
    
    return { type: 'SceneDeclaration', name: name.lexeme, body };
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
    if (this.match(TokenType.R_Text, TokenType.R_Number, TokenType.R_Boolean)) {
      return this.varDeclaration(this.previous().type);
    }

    if (this.match(TokenType.K_Rem)) {
      return this.assignment();
    }

    if (this.match(TokenType.K_When)) {
      return this.conditionalStatement();
    }

    if (this.match(TokenType.K_Character)) {
      return this.characterDeclaration();
    }

     if (this.match(TokenType.K_When)) {
      return this.conditionalOrLoop();
    }

     if (this.match(TokenType.K_Do)) {
      return this.doWhileStatement();
    }

    if (this.match(TokenType.K_Choose)) {
      return this.chooseStatement();
    }

    this.error(this.peek(), 'Invalid statement');
    throw new Error('Invalid statement');
  }

  private varDeclaration(dataType: TokenType): VariableDeclaration {
    const name = this.consume(TokenType.Identifier, 'Expected variable name');
    this.consume(TokenType.D_Semicolon, 'Expected ";" after variable declaration');
    
    return { type: 'VariableDeclaration', dataType: TokenType[dataType], name: name.lexeme };
  }

  private assignment(): any {
    const name = this.consume(TokenType.Identifier, 'Expected variable name');
    this.consume(TokenType.OP_Assign, 'Expected "=" in assignment');
    
    const value = this.expression();
    this.consume(TokenType.D_Semicolon, 'Expected ";" after assignment');
    
    return { type: 'Assignment', name: name.lexeme, value };
  }

  private conditionalStatement(): any {
    this.consume(TokenType.D_LParen, 'Expected "(" after when');
    const condition = this.expression();
    
    this.consume(TokenType.D_RParen, 'Expected ")" after condition');
    
    this.consume(TokenType.D_LBrace, 'Expected "{" after condition');
    const body = this.statementList();
    
    this.consume(TokenType.D_RBrace, 'Expected "}" to close when block');
    return { type: 'ConditionalStatement', condition, body };
  }

  private characterDeclaration(): any {
    const name = this.consume(TokenType.Identifier, 'Expected character name');
    this.consume(TokenType.D_LBrace, 'Expected "{" after character name');
    
    const fields: any[] = [];
    while (!this.check(TokenType.D_RBrace) && !this.isAtEnd()) {
      const fieldName = this.consume(TokenType.Identifier, 'Expected field name');
      this.consume(TokenType.D_Colon, 'Expected ":" after field name');
      const fieldType = this.advance();

      this.consume(TokenType.D_Semicolon, 'Expected ";" after field');
      fields.push({ name: fieldName.lexeme, type: TokenType[fieldType.type] });
    }
    
    this.consume(TokenType.D_RBrace, 'Expected "}" to close character');
    return { type: 'CharacterDeclaration', name: name.lexeme, fields };
  }

  // Expression parsing with operator precedence
  private expression(): Expression {
    return this.comparison();
  }

  private comparison(): Expression {
    let expr = this.additive();
    while (this.match(TokenType.OP_Less_Than, 
        TokenType.OP_Greater_Than, 
        TokenType.OP_Less_Equal, 
        TokenType.OP_Greater_Equal, 
        TokenType.OP_EqualTo, 
        TokenType.OP_NotEqual)) {
      
      const operator = this.previous();
      
      const right = this.additive();
      expr = { type: 'BinaryExpression', left: expr, operator: operator.lexeme, right };
    }
    return expr;
  }

  private additive(): Expression {
    let expr = this.multiplicative();
    
    while (this.match(TokenType.OP_Plus, TokenType.OP_Minus)) {
      const operator = this.previous();
      const right = this.multiplicative();
      expr = { type: 'BinaryExpression', left: expr, operator: operator.lexeme, right };
    }
    
    return expr;
  }

  private multiplicative(): Expression {
    let expr = this.primary();
   
    while (this.match(TokenType.OP_Asterisk, TokenType.OP_Slash, TokenType.OP_Modulo)) {
      const operator = this.previous();
      const right = this.primary();
      expr = { type: 'BinaryExpression', left: expr, operator: operator.lexeme, right };
    }
   
    return expr;
  }

  private primary(): Expression {
    if (this.match(TokenType.NumberLiteral)) return { type: 'Literal', value: this.previous().lexeme };
    
    if (this.match(TokenType.TextLiteral)) return { type: 'Literal', value: this.previous().lexeme };
    
    if (this.match(TokenType.Identifier)) return { type: 'Identifier', name: this.previous().lexeme };
    
    if (this.match(TokenType.D_LParen)) {
      const expr = this.expression();
      this.consume(TokenType.D_RParen, 'Expected ")" after expression');
      return expr;
    }
    
    this.error(this.peek(), 'Expected expression');
    throw new Error('Expected expression');
  }

  private conditionalOrLoop(): any {
    this.consume(TokenType.D_LParen, 'Expected "(" after when');
    const condition = this.expression();
    
    this.consume(TokenType.D_RParen, 'Expected ")" after condition');
    
    this.consume(TokenType.D_LBrace, 'Expected "{" after condition');
    
    const body = this.statementList();
    this.consume(TokenType.D_RBrace, 'Expected "}" to close when block');
  
    return { type: 'ConditionalStatement', condition, body };
    }



  private doWhileStatement(): any {
    this.consume(TokenType.D_LBrace, 'Expected "{" after do');
    const body = this.statementList();
    this.consume(TokenType.D_RBrace, 'Expected "}" after do block');
  
    this.consume(TokenType.K_When, 'Expected "when" after do block');
    
    this.consume(TokenType.D_LParen, 'Expected "(" after when');
    const condition = this.expression();
    
    this.consume(TokenType.D_RParen, 'Expected ")" after condition');
    this.consume(TokenType.D_Semicolon, 'Expected ";" after do-while');
  
    return { type: 'DoWhileStatement', body, condition };

    }

  private chooseStatement(): any {
    const variable = this.consume(TokenType.Identifier, 'Expected variable after choose');
    this.consume(TokenType.D_LBrace, 'Expected "{" after choose variable');
  
    const cases: any[] = [];
    while (!this.check(TokenType.D_RBrace) && !this.isAtEnd()) {
        if (this.match(TokenType.K_Default)) {
        this.consume(TokenType.D_Colon, 'Expected ":" after default');
        const defaultBody = this.statementList();
         cases.push({ type: 'DefaultCase', body: defaultBody });
        break;

        } else {
            const caseValue = this.advance();
            this.consume(TokenType.K_Transition, 'Expected "transition" after case value');
            this.consume(TokenType.N_To, 'Expected "to" after transition');
            
            const target = this.consume(TokenType.Identifier, 'Expected scene name');
            this.consume(TokenType.D_Semicolon, 'Expected ";" after transition');
            
            cases.push({ value: caseValue.lexeme, target: target.lexeme });
        }
    }
  
  this.consume(TokenType.D_RBrace, 'Expected "}" to close choose');
  return { type: 'ChooseStatement', variable: variable.lexeme, cases };
    }
}
