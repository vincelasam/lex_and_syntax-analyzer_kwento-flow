import { Token, TokenType } from '../types/Tokens';
import { parserUtils } from '../utils/parserUtils';
import { ASTNode, SceneDeclaration, Statement, VariableDeclaration, Expression } from '../types/AST';
import { SyntaxErrorBuilder, ErrorType } from './syntaxErr';

export class Parser extends parserUtils {
  constructor(tokens: Token[]) {
    const filteredTokens = tokens.filter(
      (t) =>
        t.type !== TokenType.SingleLineComment &&
        t.type !== TokenType.MultiLineComment
    );
    super(filteredTokens);
  }

  // --- HELPERS ---

  private isReserved(token: Token): boolean {
    const reserved = [
        TokenType.K_Scene, TokenType.K_Story, TokenType.K_Character, TokenType.K_Start,
        TokenType.K_End, TokenType.K_When, TokenType.K_Do, TokenType.K_Choose,
        TokenType.K_Log, TokenType.K_Transition, TokenType.K_Rem, TokenType.K_Input,
        TokenType.K_Says, TokenType.K_Perceives, TokenType.K_Masking, TokenType.K_Where,
        TokenType.K_Thru, TokenType.K_Default,
        TokenType.R_Text, TokenType.R_Number, TokenType.R_Boolean, TokenType.R_DB
    ];
    return reserved.includes(token.type);
  }

  // Validates identifiers and consumes them.
  // Returns a dummy token on error to prevent crashes.
  private validateAndConsumeIdentifier(context: string): Token {
    const token = this.peek();

    if (token.type === TokenType.NumberLiteral) {
        this.error(token, `Invalid ${context} '${token.lexeme}'. Identifiers cannot start with numbers.`, ErrorType.INVALID_STATEMENT);
        this.advance(); 
        return { type: TokenType.Identifier, lexeme: "ERROR_NUM", line: token.line, column: token.column };
    }

    if (this.isReserved(token)) {
        this.error(token, `The keyword '${token.lexeme}' cannot be used as ${context}.`, ErrorType.INVALID_STATEMENT);
        this.advance();
        return { type: TokenType.Identifier, lexeme: "ERROR_KW", line: token.line, column: token.column };
    }

    if (token.type === TokenType.Identifier && token.lexeme.includes('_')) {
        this.error(token, `Invalid ${context} '${token.lexeme}'. Underscores are not allowed. Use camelCase (e.g., 'myVar').`, ErrorType.INVALID_STATEMENT);
        this.advance();
        return { type: TokenType.Identifier, lexeme: "ERROR_UNDERSCORE", line: token.line, column: token.column };
    }

    if (token.type !== TokenType.Identifier) {
        this.error(token, `Invalid ${context} '${token.lexeme}'. Special characters and symbols are not allowed.`, ErrorType.INVALID_STATEMENT);
        this.advance();
        return { type: TokenType.Identifier, lexeme: "ERROR_SYMBOL", line: token.line, column: token.column };
    }

    const validToken = this.advance(); 

    // Check for hyphens (kebab-case)
    if (this.match(TokenType.OP_Minus)) {
        let badName = validToken.lexeme + "-";
        if (this.check(TokenType.Identifier) || this.check(TokenType.NumberLiteral)) {
            badName += this.advance().lexeme;
        }
        this.error(validToken, `Invalid ${context} '${badName}'. Hyphens are not allowed. Use camelCase (e.g., 'playerName').`, ErrorType.INVALID_STATEMENT);
        return { type: TokenType.Identifier, lexeme: "ERROR_HYPHEN", line: validToken.line, column: validToken.column };
    }

    return validToken;
  }

  protected synchronize(): void {
    this.advance(); 

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.D_Semicolon) return;

      switch (this.peek().type) {
        case TokenType.K_Scene:
        case TokenType.K_Character:
        case TokenType.K_Start:
        case TokenType.K_End:
        case TokenType.R_Text:
        case TokenType.R_Number:
        case TokenType.R_Boolean:
        case TokenType.R_DB:
        case TokenType.K_When:
        case TokenType.K_Do:
        case TokenType.K_Choose:
        case TokenType.K_Log:
        case TokenType.K_Transition:
        case TokenType.EOF: 
          return;
      }
      this.advance();
    }
  }

  // --- MAIN PARSER ---

  public parse(): { body: ASTNode[], errors: any[] } {
    const nodes: Statement[] = [];

    try {
      while (this.match(TokenType.K_Character)) {
        try {
          nodes.push(this.characterDeclaration());
        } catch (error) {
          this.synchronize();
        }
      }

      if (this.match(TokenType.K_Start)) {
        const sceneName = this.validateAndConsumeIdentifier("a scene name");
        this.expectSemicolon();
        nodes.push({ type: 'StartDeclaration', scene: sceneName.lexeme });
      }
    } catch (error) {
      this.synchronize();
    }

    while (!this.isAtEnd()) {
      if (this.peek().type === TokenType.EOF) break;

      try {
        if (this.match(TokenType.K_Scene)) {
          nodes.push(this.sceneDeclaration());
        } 
        else if (this.match(TokenType.R_Text, TokenType.R_Number, TokenType.R_Boolean)) {
          nodes.push(...this.varDeclaration(this.previous().type));
        }
        else if (this.match(TokenType.R_DB)) {
          nodes.push(this.dbDeclaration());
        }
        else if (this.match(TokenType.K_End)) {
          const endNode = this.endStatement();
          if (endNode.type == "EndStory") {
            nodes.push(endNode);
          } else {
            this.error(this.previous(), "Invalid top-level statement. 'end scene' can only be used inside a scene", ErrorType.INVALID_STATEMENT);
          }
        } 
        else {
          const token = this.peek();
          const suggestion = this.getKeywordSuggestion(token.lexeme); 
          this.error(token, `Unexpected token at top level: '${token.lexeme}'`, ErrorType.INVALID_STATEMENT, suggestion);
          throw new Error("Trigger Synchronization"); 
        }
      } catch (error) {
        this.synchronize();
      }
    }

    return { body: nodes, errors: this.errors };
  }

  private sceneDeclaration(): SceneDeclaration {
    const name = this.validateAndConsumeIdentifier("a scene name");
    this.consume(TokenType.D_LBrace, 'Expected "{" after scene name');
    const body = this.statementList();
    this.consume(TokenType.D_RBrace, 'Expected "}" to close scene');
    return { type: 'SceneDeclaration', name: name.lexeme, body };
  }

  private statementList(): Statement[] {
    const statements: Statement[] = [];

    while (!this.check(TokenType.D_RBrace) && !this.isAtEnd()) {
      if (this.check(TokenType.K_Scene)) break;

      try {
        const result = this.statement();
        if (Array.isArray(result)) {
            statements.push(...result);
        } else {
            statements.push(result);
        }
      } catch (error) {
        this.synchronize();
        if (this.check(TokenType.K_Scene)) break;
      }
    }
    return statements;
  }

  private statement(): Statement | Statement[] {
    if (this.match(TokenType.D_Semicolon)) {
        return []; 
    }

    if (this.match(TokenType.R_Text, TokenType.R_Number, TokenType.R_Boolean)) {
      return this.varDeclaration(this.previous().type);
    }
    if (this.match(TokenType.R_DB)) {
      return this.dbDeclaration();
    }
    if (this.match(TokenType.K_Rem)) {
      return this.assignment();
    }
    if (this.match(TokenType.K_When)) {
      return this.conditionalStatement();
    }
    if (this.match(TokenType.K_Do)) {
      return this.doWhileStatement();
    }
    if (this.match(TokenType.K_Choose)) {
      return this.chooseStatement();
    }
    if (this.match(TokenType.K_Transition)) {
      return this.transitionStatement();
    }
    if (this.match(TokenType.K_Log)) {
      return this.logStatement();
    }
    if (this.match(TokenType.K_End)) {
      return this.endStatement();
    }
    if (this.match(TokenType.K_Thru)) {
      return this.thruStatement();
    }
    
    // FIX: Graceful Error Handling for Nested Characters
    // Instead of throwing an error and crashing the scene parser,
    // we report the error, CONSUME the illegal block, and return an empty statement.
    if (this.match(TokenType.K_Character)) {
      this.error(this.previous(), "Character declarations are not allowed inside scenes. Move them to the top of the file.", ErrorType.INVALID_STATEMENT);
      
      // Consume the illegal declaration so the parser stays in sync
      this.characterDeclaration(); 
      
      // Return empty array so statementList keeps going
      return []; 
    }

    if (this.check(TokenType.Identifier)) {
      const savedPos = this.current;
      const identifier = this.advance();

      if (this.check(TokenType.OP_Minus)) {
         this.current = savedPos; 
      }

      if (this.check(TokenType.OP_Assign)) {
        this.advance(); 
        if (this.check(TokenType.K_Input)) {
          this.current = savedPos; 
          const varName = this.validateAndConsumeIdentifier("a variable name");
          const inputNode = this.inputStatement();
          return { type: 'InputStatement', variable: varName.lexeme, ...inputNode };
        } else {
          this.current = savedPos; 
        }
      } else {
        this.current = savedPos; 
      }
      
      const savedPos3 = this.current;
      const firstIdentifier = this.advance();
      
      if (this.check(TokenType.Identifier)) {
        const instanceToken = this.peek();
        if (instanceToken.type === TokenType.NumberLiteral || this.isReserved(instanceToken) || instanceToken.type !== TokenType.Identifier) {
             this.validateAndConsumeIdentifier("an instance name");
             if (this.match(TokenType.D_Semicolon)) {
                 return { type: 'CharacterInstantiation', characterType: firstIdentifier.lexeme, instanceName: "ERROR" };
             }
        }

        const secondIdentifier = this.advance();
        
        if (this.match(TokenType.OP_Minus)) {
             this.current = savedPos3; 
             this.advance(); 
             this.validateAndConsumeIdentifier("an instance name"); 
             this.match(TokenType.D_Semicolon); 
             return { type: 'CharacterInstantiation', characterType: firstIdentifier.lexeme, instanceName: "ERROR_HYPHEN" };
        }

        if (this.match(TokenType.D_Semicolon)) {
          return { 
            type: 'CharacterInstantiation', 
            characterType: firstIdentifier.lexeme, 
            instanceName: secondIdentifier.lexeme 
          };
        }
        this.current = savedPos3;
      }
      
      if (this.check(TokenType.K_Says)) {
        this.current = savedPos3;
        return this.saysStatement();
      }
      
      this.current = savedPos3; 
    }

    const token = this.peek();
    const suggestion = this.getKeywordSuggestion(token.lexeme);
    const err = SyntaxErrorBuilder.invalidStatement(token.lexeme, token.line, token.column, suggestion);
    this.errors.push(err);
    throw new Error(err.message);
  }

  private varDeclaration(dataType: TokenType): VariableDeclaration[] {
    const declarations: VariableDeclaration[] = [];
    do {
      const name = this.validateAndConsumeIdentifier("a variable name");
      declarations.push({ 
        type: 'VariableDeclaration', 
        dataType: TokenType[dataType], 
        name: name.lexeme 
      });
    } while (this.match(TokenType.D_Comma));

    this.expectSemicolon();
    return declarations;
  }

  private dbDeclaration(): any {
    const name = this.validateAndConsumeIdentifier("a database name");
    this.consume(TokenType.OP_Assign, 'Expected "=" after db name');
    const connectionString = this.consume(TokenType.TextLiteral, 'Expected connection string');
    this.expectSemicolon();
    return { type: 'DbDeclaration', name: name.lexeme, connectionString: connectionString.lexeme };
  }

  private assignment(): any {
    const name = this.validateAndConsumeIdentifier("a variable name");
    if (this.match(TokenType.D_Dot)) {
      const property = this.consume(TokenType.Identifier, 'Expected property name after "."');
      this.consume(TokenType.OP_Assign, 'Expected "=" in assignment');
      const value = this.expression();
      this.expectSemicolon();
      return { type: 'Assignment', target: { type: 'MemberAccess', object: name.lexeme, property: property.lexeme }, value };
    }
    this.consume(TokenType.OP_Assign, 'Expected "=" in assignment');
    const value = this.expression();
    this.expectSemicolon();
    return { type: 'Assignment', target: name.lexeme, value };
  }

  private conditionalStatement(): any {
    this.consume(TokenType.D_LParen, 'Expected "(" after when');
    const condition = this.expression();
    this.consume(TokenType.D_RParen, 'Expected ")" after condition');
    this.match(TokenType.N_Then);

    this.consume(TokenType.D_LBrace, 'Expected "{" after condition');
    const body = this.statementList();
    this.consume(TokenType.D_RBrace, 'Expected "}" to close when block');
    return { type: 'ConditionalStatement', condition, body };
  }

  private characterDeclaration(): any {
    const name = this.validateAndConsumeIdentifier("a character name");

    if (this.match(TokenType.K_Perceives)) {
       const block = this.perceivesBlock();
       return { type: 'CharacterDeclaration', name: name.lexeme, fields: [], perceivesBlocks: [block] };
    }

    this.consume(TokenType.D_LBrace, 'Expected "{" after character name');
    const fields: any[] = [];
    const perceivesBlocks: any[] = [];

    while (!this.check(TokenType.D_RBrace) && !this.isAtEnd()) {
      if (this.match(TokenType.K_Perceives)) {
        perceivesBlocks.push(this.perceivesBlock());
      } else {
        const fieldName = this.validateAndConsumeIdentifier("a field name");
        this.consume(TokenType.D_Colon, 'Expected ":" after field name');
        const fieldType = this.advance();
        this.expectSemicolon();
        fields.push({ name: fieldName.lexeme, type: TokenType[fieldType.type] });
      }
    }

    this.consume(TokenType.D_RBrace, 'Expected "}" to close character');
    return { type: 'CharacterDeclaration', name: name.lexeme, fields, perceivesBlocks };
  }

  private doWhileStatement(): any {
    this.consume(TokenType.D_LBrace, 'Expected "{" after do');
    const body = this.statementList();
    this.consume(TokenType.D_RBrace, 'Expected "}" after do block');
    this.consume(TokenType.K_When, 'Expected "when" after do block');
    this.consume(TokenType.D_LParen, 'Expected "(" after when');
    const condition = this.expression();
    this.consume(TokenType.D_RParen, 'Expected ")" after condition');
    this.expectSemicolon();
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
        this.match(TokenType.N_To);
        const target = this.consume(TokenType.Identifier, 'Expected scene name');
        this.expectSemicolon();
        cases.push({ value: caseValue.lexeme, target: target.lexeme });
      }
    }
    this.consume(TokenType.D_RBrace, 'Expected "}" to close choose');
    return { type: 'ChooseStatement', variable: variable.lexeme, cases };
  }

  private transitionStatement(): any {
    this.match(TokenType.N_To);
    const target = this.consume(TokenType.Identifier, 'Expected scene name after transition');
    this.expectSemicolon();
    return { type: 'TransitionStatement', target: target.lexeme };
  }

  private logStatement(): any {
    const message = this.consume(TokenType.TextLiteral, 'Expected message after log');
    this.expectSemicolon();
    return { type: 'LogStatement', message: message.lexeme };
  }

  private saysStatement(): any {
    const character = this.consume(TokenType.Identifier, 'Expected character name');
    this.consume(TokenType.K_Says, 'Expected "says" after character');
    const message = this.consume(TokenType.TextLiteral, 'Expected message');
    this.expectSemicolon();
    return { type: 'SaysStatement', character: character.lexeme, message: message.lexeme };
  }

  private endStatement(): any {
    let node;
    if (this.match(TokenType.K_Scene)) {
        node = { type: 'EndScene' };
    } else if (this.match(TokenType.K_Story)) {
        node = { type: 'EndStory' };
    } else {
        this.error(this.peek(), 'Expected "scene" or "story" after end', ErrorType.INVALID_STATEMENT);
        throw new Error('Invalid end statement');
    }
    
    this.expectSemicolon();
    return node;
  }

  private expression(): Expression { return this.logicalOr(); }

  private logicalOr(): Expression {
    let expr = this.logicalAnd();
    while (this.match(TokenType.OP_Logical_Or)) {
      const operator = this.previous();
      const right = this.logicalAnd();
      expr = { type: 'BinaryExpression', left: expr, operator: operator.lexeme, right };
    }
    return expr;
  }

  private logicalAnd(): Expression {
    let expr = this.comparison();
    while (this.match(TokenType.OP_Logical_And)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = { type: 'BinaryExpression', left: expr, operator: operator.lexeme, right };
    }
    return expr;
  }

  private comparison(): Expression {
    let expr = this.additive();
    while (this.match(TokenType.OP_Less_Than, TokenType.OP_Greater_Than, TokenType.OP_Less_Equal, TokenType.OP_Greater_Equal, TokenType.OP_EqualTo, TokenType.OP_NotEqual)) {
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
    let expr = this.unary();
    while (this.match(TokenType.OP_Asterisk, TokenType.OP_Slash, TokenType.OP_Modulo)) {
      const operator = this.previous();
      const right = this.unary();
      expr = { type: 'BinaryExpression', left: expr, operator: operator.lexeme, right };
    }
    return expr;
  }

  private unary(): Expression {
    if (this.match(TokenType.OP_Logical_Not, TokenType.OP_Minus)) {
      const operator = this.previous();
      const right = this.unary();
      return { type: 'UnaryExpression', operator: operator.lexeme, operand: right };
    }
    return this.primary();
  }

  private primary(): Expression {
    if (this.match(TokenType.NumberLiteral)) return { type: 'Literal', value: this.previous().lexeme };
    if (this.match(TokenType.TextLiteral)) return { type: 'Literal', value: this.previous().lexeme };
    if (this.match(TokenType.BooleanLiteral)) return { type: 'Literal', value: this.previous().lexeme };

    if (this.match(TokenType.D_LParen)) {
      const expr = this.expression();
      this.consume(TokenType.D_RParen, 'Expected ")" after expression');
      return expr;
    }

    if (this.check(TokenType.Identifier)) {
      const name = this.advance();
      if (this.match(TokenType.D_Dot)) {
        const property = this.consume(TokenType.Identifier, 'Expected property or method name after "."');
        if (this.match(TokenType.D_LParen)) {
          const args: Expression[] = [];
          if (!this.check(TokenType.D_RParen)) {
            do { args.push(this.expression()); } while (this.match(TokenType.D_Comma));
          }
          this.consume(TokenType.D_RParen, 'Expected ")" after arguments');
          return { type: 'MethodCall', object: name.lexeme, method: property.lexeme, arguments: args };
        }
        return { type: 'MemberAccess', object: name.lexeme, property: property.lexeme };
      }
      if (this.match(TokenType.D_LParen)) {
        const args: Expression[] = [];
        if (!this.check(TokenType.D_RParen)) {
          do { args.push(this.expression()); } while (this.match(TokenType.D_Comma));
        }
        this.consume(TokenType.D_RParen, 'Expected ")" after arguments');
        return { type: 'FunctionCall', name: name.lexeme, arguments: args };
      }
      return { type: 'Identifier', name: name.lexeme };
    }

    this.error(this.peek(), 'Expected expression', ErrorType.INVALID_EXPRESSION);
    throw new Error('Expected expression');
  }

  private perceivesBlock(): any {
    const target = this.validateAndConsumeIdentifier("a target name");
    let fullTarget = target.lexeme;
    if (this.match(TokenType.D_Dot)) {
      const table = this.consume(TokenType.Identifier, 'Expected table name after "."');
      fullTarget = `${target.lexeme}.${table.lexeme}`;
    }

    this.consume(TokenType.D_LBrace, 'Expected "{" after perceives target');
    const policies: any[] = [];
    while (!this.check(TokenType.D_RBrace) && !this.isAtEnd()) {
      if (this.match(TokenType.K_Masking)) {
        policies.push(this.maskingPolicy());
      } else if (this.match(TokenType.K_Where)) {
        policies.push(this.wherePolicy());
      } else {
        this.error(this.peek(), 'Expected masking or where in perceives block', ErrorType.INVALID_STATEMENT);
        this.advance();
      }
    }
    this.consume(TokenType.D_RBrace, 'Expected "}" to close perceives');
    return { type: 'PerceivesBlock', target: fullTarget, policies };
  }

  private maskingPolicy(): any {
    const fields: string[] = [];
    do {
      const field = this.validateAndConsumeIdentifier("a field name");
      fields.push(field.lexeme);
    } while (this.match(TokenType.D_Comma));
    this.expectSemicolon();
    return { type: 'MaskingPolicy', fields };
  }

  private wherePolicy(): any {
    const condition = this.expression();
    this.expectSemicolon();
    return { type: 'WherePolicy', condition };
  }

  private thruStatement(): any {
    const character = this.validateAndConsumeIdentifier("a character name");
    this.consume(TokenType.D_LBrace, 'Expected "{" after character type in thru statement');
    const body = this.statementList();
    this.consume(TokenType.D_RBrace, 'Expected "}" to close thru block');
    return { type: 'ThruStatement', character: character.lexeme, body };
  }

  private inputStatement(): any {
    this.consume(TokenType.OP_Assign, 'Expected "=" in input statement');
    this.consume(TokenType.K_Input, 'Expected "input" keyword');
    this.consume(TokenType.D_LParen, 'Expected "(" after input');
    const prompt = this.consume(TokenType.TextLiteral, 'Expected string prompt inside input()');
    this.consume(TokenType.D_RParen, 'Expected ")" after prompt');
    this.expectSemicolon();
    return { type: 'InputStatement', prompt: prompt.lexeme }
  }
}