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

  // Main entry point: parses entire KwentoFlow program
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

      // Optional start declaration (entry point)
      if (this.match(TokenType.K_Start)) {
        const sceneName = this.consume(TokenType.Identifier, 'Expected scene name after start');
        this.expectSemicolon();
        nodes.push({ type: 'StartDeclaration', scene: sceneName.lexeme });
      }
    } catch (error) {
      this.synchronize();
    }

    // Parse all scenes (required)
    while (!this.isAtEnd()) {
      try {
        if (this.match(TokenType.K_Scene)) {
          nodes.push(this.sceneDeclaration());
        } else if (this.match(TokenType.K_End)) {
          const endNode = this.endStatement();

          if (endNode.type == "EndStory") {
            nodes.push(endNode);
          } else {
            this.error(this.previous(), "Invalid top-level statement. 'end scene' can only be used inside a scene", ErrorType.INVALID_STATEMENT);
          }
        } else {
          this.error(this.peek(), 'Expected scene declaration', ErrorType.INVALID_STATEMENT);
          this.advance();
        }
      } catch (error) {
        this.synchronize();
      }
    }

    return { body: nodes, errors: this.errors };
  }


  // Parses: scene Name { statements }
  private sceneDeclaration(): SceneDeclaration {
    const name = this.consume(TokenType.Identifier, 'Expected scene name');
    this.consume(TokenType.D_LBrace, 'Expected "{" after scene name');
    const body = this.statementList();
    this.consume(TokenType.D_RBrace, 'Expected "}" to close scene');
    return { type: 'SceneDeclaration', name: name.lexeme, body };
  }

  // Recursively parses statements until closing brace
  private statementList(): Statement[] {
    const statements: Statement[] = [];

    while (!this.check(TokenType.D_RBrace) && !this.isAtEnd()) {

      if (this.check(TokenType.K_Scene)) {
        break;
      }

      try {
        statements.push(this.statement());
      } catch (error) {
        this.synchronize();

        if (this.check(TokenType.K_Scene)) {
          break;
        }
      }
    }

    return statements;
  }

  // Routes to appropriate statement parser based on token type
  private statement(): Statement {
    // Variable declarations: text x; number y;
    if (this.match(TokenType.R_Text, TokenType.R_Number, TokenType.R_Boolean)) {
      return this.varDeclaration(this.previous().type);
    }

    // Database declarations: db Name = "connection_string";
    if (this.match(TokenType.R_DB)) {
      return this.dbDeclaration();
    }

    // Assignments: rem x = 10;
    if (this.match(TokenType.K_Rem)) {
      return this.assignment();
    }

    // Conditionals/loops: when (condition) { }
    if (this.match(TokenType.K_When)) {
      return this.conditionalStatement();
    }

    // Do-while loops: do { } when (condition);
    if (this.match(TokenType.K_Do)) {
      return this.doWhileStatement();
    }

    // Switch-like statements: choose var { }
    if (this.match(TokenType.K_Choose)) {
      return this.chooseStatement();
    }

    // Scene transitions: transition to SceneName;
    if (this.match(TokenType.K_Transition)) {
      return this.transitionStatement();
    }

    // Console output: log "message";
    if (this.match(TokenType.K_Log)) {
      return this.logStatement();
    }

    // Program/scene termination: end scene; end story;
    if (this.match(TokenType.K_End)) {
      return this.endStatement();
    }

    // Security keyword "thru"
    if (this.match(TokenType.K_Thru)) {
      return this.thruStatement();
    }

    if (this.match(TokenType.K_Character)) {
      this.error(this.previous(), "Character declarations are not allowed inside scenes. Move them to the top of the file.", ErrorType.INVALID_STATEMENT);
      throw new Error("Invalid statement");
    }

    // --- UPDATED SECTION START ---
    // Check for Input, Character instantiation, or Dialogue
    if (this.check(TokenType.Identifier)) {
      const savedPos = this.current;
      const identifier = this.advance();

      // 1. Check if this is an input statement: var = input(...)
      if (this.check(TokenType.OP_Assign)) {
        const savedPos2 = this.current;
        this.advance(); // consume '=' to peek forward

        if (this.check(TokenType.K_Input)) {
          // It's an input statement! Parse it fully
          this.current = savedPos; // Reset to start of line (Identifier)
          const varName = this.advance(); // re-consume identifier
          const inputNode = this.inputStatement(); // This will consume '= input(...)'
          
          return {
            type: 'InputStatement',
            variable: varName.lexeme,
            ...inputNode // Spreads prompt from the result of inputStatement()
          };
        } else {
          // Not input, restore and continue to other checks
          this.current = savedPos;
        }
      } else {
        // Restore position
        this.current = savedPos;
      }

      // 2. Check for Character Instantiation or Dialogue
      const savedPos3 = this.current;
      const firstIdentifier = this.advance();

      // Check for character instantiation: Player hero;
      if (this.check(TokenType.Identifier)) {
        const secondIdentifier = this.advance();
        if (this.match(TokenType.D_Semicolon)) {
          return {
            type: 'CharacterInstantiation',
            characterType: firstIdentifier.lexeme,
            instanceName: secondIdentifier.lexeme
          };
        }
        this.current = savedPos3; // Backtrack if semicolon missing
      }

      // Check for character dialogue: CharName says "message";
      if (this.check(TokenType.K_Says)) {
        this.current = savedPos3; // Reset to parse correctly via helper
        return this.saysStatement();
      }

      // Reset if nothing matched
      this.current = savedPos3;
    }
    // --- UPDATED SECTION END ---

    const token = this.peek();
    const suggestion = this.getKeywordSuggestion(token.lexeme);

    const err = SyntaxErrorBuilder.invalidStatement(
      token.lexeme,
      token.line,
      token.column,
      suggestion
    );

    this.errors.push(err);
    throw new Error(err.message);
  }

  private varDeclaration(dataType: TokenType): VariableDeclaration {
    const name = this.consume(TokenType.Identifier, 'Expected variable name');
    this.expectSemicolon();
    return { type: 'VariableDeclaration', dataType: TokenType[dataType], name: name.lexeme };
  }

  // Handles database connections: db Name = "mysql://...";
  private dbDeclaration(): any {
    const name = this.consume(TokenType.Identifier, 'Expected db name');
    this.consume(TokenType.OP_Assign, 'Expected "=" after db name');
    const connectionString = this.consume(TokenType.TextLiteral, 'Expected connection string');
    this.expectSemicolon();
    return { type: 'DbDeclaration', name: name.lexeme, connectionString: connectionString.lexeme };
  }

  private assignment(): any {
    const name = this.consume(TokenType.Identifier, 'Expected variable name');

    // Check for member access: hero.health
    if (this.match(TokenType.D_Dot)) {
      const property = this.consume(TokenType.Identifier, 'Expected property name after "."');
      this.consume(TokenType.OP_Assign, 'Expected "=" in assignment');
      const value = this.expression();
      this.expectSemicolon();

      return {
        type: 'Assignment',
        target: { type: 'MemberAccess', object: name.lexeme, property: property.lexeme },
        value
      };
    }

    // Simple assignment: x = 10
    this.consume(TokenType.OP_Assign, 'Expected "=" in assignment');
    const value = this.expression();
    this.expectSemicolon();

    return {
      type: 'Assignment',
      target: name.lexeme,
      value
    };
  }

  // Handles both conditionals and while loops (same syntax in KwentoFlow)
  private conditionalStatement(): any {
    this.consume(TokenType.D_LParen, 'Expected "(" after when');
    const condition = this.expression();
    this.consume(TokenType.D_RParen, 'Expected ")" after condition');

    // Optional noise word "then"
    this.match(TokenType.N_Then);

    this.consume(TokenType.D_LBrace, 'Expected "{" after condition');
    const body = this.statementList();
    this.consume(TokenType.D_RBrace, 'Expected "}" to close when block');
    return { type: 'ConditionalStatement', condition, body };
  }

  // Defines character types with fields
  private characterDeclaration(): any {
    const name = this.consume(TokenType.Identifier, 'Expected character name');
    this.consume(TokenType.D_LBrace, 'Expected "{" after character name');

    const fields: any[] = [];
    const perceivesBlocks: any[] = [];

    while (!this.check(TokenType.D_RBrace) && !this.isAtEnd()) {
      if (this.match(TokenType.K_Perceives)) {
        const target = this.consume(TokenType.Identifier, 'Expected table/character name');

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
        perceivesBlocks.push({ type: 'PerceivesBlock', target: fullTarget, policies });

      } else {
        // Regular field: name: type;
        const fieldName = this.consume(TokenType.Identifier, 'Expected field name');
        this.consume(TokenType.D_Colon, 'Expected ":" after field name');
        const fieldType = this.advance();
        this.expectSemicolon();
        fields.push({ name: fieldName.lexeme, type: TokenType[fieldType.type] });
      }
    }

    this.consume(TokenType.D_RBrace, 'Expected "}" to close character');
    return {
      type: 'CharacterDeclaration',
      name: name.lexeme,
      fields,
      perceivesBlocks
    };
  }

  // do { } when (condition); - executes at least once
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

  // Switch-like multi-branch selection
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
        this.match(TokenType.N_To); // "to" is optional noise word
        const target = this.consume(TokenType.Identifier, 'Expected scene name');
        this.expectSemicolon();
        cases.push({ value: caseValue.lexeme, target: target.lexeme });
      }
    }

    this.consume(TokenType.D_RBrace, 'Expected "}" to close choose');
    return { type: 'ChooseStatement', variable: variable.lexeme, cases };
  }

  private transitionStatement(): any {
    this.match(TokenType.N_To); // "to" is optional noise word
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
    if (this.match(TokenType.K_Scene)) {
      this.expectSemicolon();
      return { type: 'EndScene' };
    }
    if (this.match(TokenType.K_Story)) {
      this.expectSemicolon();
      return { type: 'EndStory' };
    }
    this.error(this.peek(), 'Expected "scene" or "story" after end', ErrorType.INVALID_STATEMENT);
    throw new Error('Invalid end statement');
  }

  // Expression parsing with full operator precedence
  private expression(): Expression {
    return this.logicalOr();
  }

  // Handles || (logical OR) - lowest precedence
  private logicalOr(): Expression {
    let expr = this.logicalAnd();
    while (this.match(TokenType.OP_Logical_Or)) {
      const operator = this.previous();
      const right = this.logicalAnd();
      expr = { type: 'BinaryExpression', left: expr, operator: operator.lexeme, right };
    }
    return expr;
  }

  // Handles && (logical AND)
  private logicalAnd(): Expression {
    let expr = this.comparison();
    while (this.match(TokenType.OP_Logical_And)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = { type: 'BinaryExpression', left: expr, operator: operator.lexeme, right };
    }
    return expr;
  }

  // Handles ==, !=, <, >, <=, >=
  private comparison(): Expression {
    let expr = this.additive();
    while (this.match(TokenType.OP_Less_Than, TokenType.OP_Greater_Than, TokenType.OP_Less_Equal, TokenType.OP_Greater_Equal, TokenType.OP_EqualTo, TokenType.OP_NotEqual)) {
      const operator = this.previous();
      const right = this.additive();
      expr = { type: 'BinaryExpression', left: expr, operator: operator.lexeme, right };
    }
    return expr;
  }

  // Handles +, - (addition, subtraction)
  private additive(): Expression {
    let expr = this.multiplicative();
    while (this.match(TokenType.OP_Plus, TokenType.OP_Minus)) {
      const operator = this.previous();
      const right = this.multiplicative();
      expr = { type: 'BinaryExpression', left: expr, operator: operator.lexeme, right };
    }
    return expr;
  }

  // Handles *, /, % (multiplication, division, modulo) - highest precedence
  private multiplicative(): Expression {
    let expr = this.unary();
    while (this.match(TokenType.OP_Asterisk, TokenType.OP_Slash, TokenType.OP_Modulo)) {
      const operator = this.previous();
      const right = this.unary();
      expr = { type: 'BinaryExpression', left: expr, operator: operator.lexeme, right };
    }
    return expr;
  }

  // Handles unary operators: ! (logical NOT), - (negation)
  private unary(): Expression {
    if (this.match(TokenType.OP_Logical_Not, TokenType.OP_Minus)) {
      const operator = this.previous();
      const right = this.unary();
      return { type: 'UnaryExpression', operator: operator.lexeme, operand: right };
    }
    return this.primary();
  }

  // Base case: literals, identifiers, function calls, member access, parentheses
  private primary(): Expression {
    if (this.match(TokenType.NumberLiteral)) return { type: 'Literal', value: this.previous().lexeme };
    if (this.match(TokenType.TextLiteral)) return { type: 'Literal', value: this.previous().lexeme };
    if (this.match(TokenType.BooleanLiteral)) return { type: 'Literal', value: this.previous().lexeme };

    // Parenthesized expressions
    if (this.match(TokenType.D_LParen)) {
      const expr = this.expression();
      this.consume(TokenType.D_RParen, 'Expected ")" after expression');
      return expr;
    }

    // Identifier, member access, or function/method call
    if (this.check(TokenType.Identifier)) {
      const name = this.advance();

      // Check for member access: obj.property or obj.method()
      if (this.match(TokenType.D_Dot)) {
        const property = this.consume(TokenType.Identifier, 'Expected property or method name after "."');

        // Check for method call: obj.method()
        if (this.match(TokenType.D_LParen)) {
          const args: Expression[] = [];
          if (!this.check(TokenType.D_RParen)) {
            do {
              args.push(this.expression());
            } while (this.match(TokenType.D_Comma));
          }
          this.consume(TokenType.D_RParen, 'Expected ")" after arguments');
          return {
            type: 'MethodCall',
            object: name.lexeme,
            method: property.lexeme,
            arguments: args
          };
        }

        // Simple member access: obj.property
        return {
          type: 'MemberAccess',
          object: name.lexeme,
          property: property.lexeme
        };
      }

      // Check for function call: func()
      if (this.match(TokenType.D_LParen)) {
        const args: Expression[] = [];
        if (!this.check(TokenType.D_RParen)) {
          do {
            args.push(this.expression());
          } while (this.match(TokenType.D_Comma));
        }
        this.consume(TokenType.D_RParen, 'Expected ")" after arguments');
        return { type: 'FunctionCall', name: name.lexeme, arguments: args };
      }

      // Plain identifier
      return { type: 'Identifier', name: name.lexeme };
    }

    this.error(this.peek(), 'Expected expression', ErrorType.INVALID_EXPRESSION);
    throw new Error('Expected expression');
  }

  private perceivesBlock(): any {
    // character Admin perceives db.users { masking password; }
    // OR: character Guard perceives Player { masking gold; }
    const target = this.consume(TokenType.Identifier, 'Expected table/character name');

    // Check for database.table notation
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
    // masking field1, field2, field3;
    const fields: string[] = [];
    do {
      const field = this.consume(TokenType.Identifier, 'Expected field name');
      fields.push(field.lexeme);
    } while (this.match(TokenType.D_Comma));

    this.expectSemicolon();
    return { type: 'MaskingPolicy', fields };
  }

  private wherePolicy(): any {
    // where userID == currentUser.id;
    const condition = this.expression();
    this.expectSemicolon();
    return { type: 'WherePolicy', condition };
  }

  private thruStatement(): any {
    const character = this.consume(TokenType.Identifier, 'Expected character name after thru');

    this.consume(TokenType.D_LBrace, 'Expected "{" after character type in thru statement');

    const body = this.statementList();

    this.consume(TokenType.D_RBrace, 'Expected "}" to close thru block');

    return {
      type: 'ThruStatement',
      character: character.lexeme,
      body
    };
  }

  private inputStatement(): any {
    this.consume(TokenType.OP_Assign, 'Expected "=" in input statement');

    this.consume(TokenType.K_Input, 'Expected "input" keyword');

    this.consume(TokenType.D_LParen, 'Expected "(" after input');

    const prompt = this.consume(TokenType.TextLiteral, 'Expected string prompt inside input()');

    this.consume(TokenType.D_RParen, 'Expected ")" after prompt');

    this.expectSemicolon();

    return {
      type: 'InputStatement',
      prompt: prompt.lexeme
    }
  }
}