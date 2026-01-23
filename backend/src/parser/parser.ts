import { Token, TokenType } from '../types/Tokens';
import { parserUtils } from '../utils/parserUtils';
import { ASTNode, SceneDeclaration, Statement, VariableDeclaration, Expression } from '../types/AST';
import { SyntaxErrorBuilder, ErrorType } from './syntaxErr';

export class Parser extends parserUtils {
  constructor(tokens: Token[]) {
    // Filter out comments
    const filteredTokens = tokens.filter(
      (t) =>
        t.type !== TokenType.SingleLineComment &&
        t.type !== TokenType.MultiLineComment
    );
    super(filteredTokens);
  }

  // --- 1. VALIDATION HELPERS ---

  // Check if a token is a reserved keyword
  private isReserved(token: Token): boolean {
    const reserved = [
        // Scene and flow control
        TokenType.K_Scene, TokenType.K_Story, TokenType.K_Character, TokenType.K_Start,
        TokenType.K_End, TokenType.K_When, TokenType.K_Do, TokenType.K_Choose,
        TokenType.K_Log, TokenType.K_Transition, TokenType.K_Rem, TokenType.K_Input,
        // Character interaction keywords
        TokenType.K_Says,         // For character dialogue
        TokenType.K_Perceives,    // For data access policies (in character declarations)
        TokenType.K_Masking,      // For field masking in perceives blocks
        TokenType.K_Where,        // For filtering conditions in perceives blocks
        TokenType.K_Thru,         // For character-scoped execution blocks
        TokenType.K_Default,
        // Data types
        TokenType.R_Text, TokenType.R_Number, TokenType.R_Boolean, TokenType.R_DB
    ];
    return reserved.includes(token.type);
  }

  // CENTRALIZED IDENTIFIER VALIDATION - RETURNS VALID TOKEN OR DUMMY
  // Does NOT throw - just logs error and returns a placeholder
  private validateAndConsumeIdentifier(context: string): Token {
    const token = this.peek();

    // 1. No Numbers
    if (token.type === TokenType.NumberLiteral) {
        this.error(token, `Invalid ${context} '${token.lexeme}'. Identifiers cannot start with numbers.`, ErrorType.INVALID_STATEMENT);
        this.advance(); 
        return { type: TokenType.Identifier, lexeme: "ERROR_NUM", line: token.line, column: token.column };
    }

    // 2. No Keywords
    if (this.isReserved(token)) {
        this.error(token, `The keyword '${token.lexeme}' cannot be used as ${context}.`, ErrorType.INVALID_STATEMENT);
        this.advance();
        return { type: TokenType.Identifier, lexeme: "ERROR_KW", line: token.line, column: token.column };
    }

    // 3. No Underscores (CamelCase only)
    if (token.type === TokenType.Identifier && token.lexeme.includes('_')) {
        this.error(token, `Invalid ${context} '${token.lexeme}'. Underscores are not allowed. Use camelCase (e.g., 'myVar').`, ErrorType.INVALID_STATEMENT);
        this.advance();
        return { type: TokenType.Identifier, lexeme: "ERROR_UNDERSCORE", line: token.line, column: token.column };
    }

    // 4. No Symbols
    if (token.type !== TokenType.Identifier) {
        this.error(token, `Invalid ${context} '${token.lexeme}'. Special characters and symbols are not allowed.`, ErrorType.INVALID_STATEMENT);
        this.advance();
        return { type: TokenType.Identifier, lexeme: "ERROR_SYMBOL", line: token.line, column: token.column };
    }

    // 5. No Hyphens (Lookahead for kebab-case)
    const validToken = this.advance(); 

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

  // --- 2. RECOVERY HELPERS ---

  private isStartOfStatement(type: TokenType): boolean {
    switch (type) {
        case TokenType.K_Scene: case TokenType.K_Character: case TokenType.K_Start:
        case TokenType.K_End: case TokenType.R_Text: case TokenType.R_Number:
        case TokenType.R_Boolean: case TokenType.R_DB: case TokenType.K_When:
        case TokenType.K_Do: case TokenType.K_Choose: case TokenType.K_Log:
        case TokenType.K_Transition: case TokenType.K_Rem: case TokenType.K_Thru:
        case TokenType.Identifier: 
            return true;
        default:
            return false;
    }
  }

  // IMPROVED: Soft semicolon check - reports error but doesn't crash
  private consumeSemicolon(): void {
    if (this.match(TokenType.D_Semicolon)) return;

    const token = this.peek();
    this.error(token, "Expected ';' after statement.", ErrorType.MISSING_TOKEN);

    // Only skip ahead if we're truly lost (not at a statement boundary)
    const nextType = this.peek().type;
    if (!this.isStartOfStatement(nextType) && 
        nextType !== TokenType.D_RBrace && 
        nextType !== TokenType.EOF) {
        // Eat tokens until we find something safe
        while (!this.isAtEnd() && 
               !this.isStartOfStatement(this.peek().type) &&
               this.peek().type !== TokenType.D_RBrace &&
               this.peek().type !== TokenType.D_Semicolon) {
            this.advance();
        }
        // If we found a semicolon, consume it
        if (this.peek().type === TokenType.D_Semicolon) {
            this.advance();
        }
    }
  }

  // IMPROVED: Soft consume - logs error but returns dummy token instead of throwing
  private softConsume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    
    const token = this.peek();
    this.error(token, message, ErrorType.MISSING_TOKEN);
    
    // Return a dummy token with the expected type
    return { 
      type, 
      lexeme: TokenType[type], 
      line: token.line, 
      column: token.column 
    };
  }

  // IMPROVED: Panic mode recovery - more conservative
   protected synchronize(): void {
    while (!this.isAtEnd()) {
      // Stop at semicolons (statement boundaries)
      if (this.peek().type === TokenType.D_Semicolon) {
        this.advance(); // Consume the semicolon
        return;
      }
      if (this.previous().type === TokenType.D_Semicolon) return;
      
      // Stop at block boundaries
      if (this.peek().type === TokenType.D_RBrace) return;
      if (this.peek().type === TokenType.EOF) return;

      // Don't stop at statement starters - they might be invalid in current context
      // and would cause the parser to produce new errors that weren't in the input
      // Instead, continue advancing until we find a safe boundary (semicolon, brace, or EOF)

      this.advance();
    }
  }

  // --- 3. MAIN PARSER ---

  public parse(): { body: ASTNode[], errors: any[] } {
    const nodes: Statement[] = [];

    // 1. Character Declarations (Must be top-level)
    while (this.match(TokenType.K_Character)) {
      try {
        nodes.push(this.characterDeclaration());
      } catch (error) {
        this.synchronize();
      }
    }

    // 2. Start Scene Declaration
    if (this.match(TokenType.K_Start)) {
      try {
        const sceneName = this.validateAndConsumeIdentifier("a scene name");
        this.consumeSemicolon();
        nodes.push({ type: 'StartDeclaration', scene: sceneName.lexeme });
      } catch (error) {
        this.synchronize();
      }
    }

    // 3. Main Body (Scenes, Globals, DBs)
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
          // Unexpected token at top level
          const token = this.peek();
          const suggestion = this.getKeywordSuggestion(token.lexeme);
          const message = suggestion
           ? `Unexpected token at top level: '${token.lexeme}'. Did you mean '${suggestion}'?`
           : `Unexpected token at top level: '${token.lexeme}'`;
          this.error(token, message, ErrorType.INVALID_STATEMENT, suggestion);
          this.advance(); // Consume the bad token
          // DON'T synchronize - just continue to next token
        }
      } catch (error) {
        this.synchronize();
      }
    }

    return { body: nodes, errors: this.errors };
  }

  private sceneDeclaration(): SceneDeclaration {
    const name = this.validateAndConsumeIdentifier("a scene name");
    this.softConsume(TokenType.D_LBrace, 'Expected "{" after scene name');
    const body = this.statementList();
    this.softConsume(TokenType.D_RBrace, 'Expected "}" to close scene');
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

  // --- 4. STATEMENT DISPATCHER ---

  private statement(): Statement | Statement[] {
    if (this.match(TokenType.D_Semicolon)) return [];

    // Variable declarations
    if (this.match(TokenType.R_Text, TokenType.R_Number, TokenType.R_Boolean)) {
      return this.varDeclaration(this.previous().type);
    }
    
    // Database declaration
    if (this.match(TokenType.R_DB)) {
      return this.dbDeclaration();
    }
    
    // Assignment (rem keyword)
    if (this.match(TokenType.K_Rem)) {
      return this.assignment();
    }
    
    // Control flow
    if (this.match(TokenType.K_When)) {
      return this.conditionalStatement();
    }
    if (this.match(TokenType.K_Do)) {
      return this.doWhileStatement();
    }
    if (this.match(TokenType.K_Choose)) {
      return this.chooseStatement();
    }
    
    // Scene transitions and output
    if (this.match(TokenType.K_Transition)) {
      return this.transitionStatement();
    }
    if (this.match(TokenType.K_Log)) {
      return this.logStatement();
    }
    if (this.match(TokenType.K_End)) {
      return this.endStatement();
    }
    
    // Character-scoped execution block (NEW FEATURE)
    if (this.match(TokenType.K_Thru)) {
      return this.thruStatement();
    }
    
    // Nested character error
    if (this.match(TokenType.K_Character)) {
      this.error(this.previous(), "Character declarations are not allowed inside scenes. Move them to the top of the file.", ErrorType.INVALID_STATEMENT);
      this.characterDeclaration();
      return [];
    }

    if (this.check(TokenType.Identifier)) {
      const savedPos = this.current;
      const identifier = this.advance();

      // Check for hyphenated names
      if (this.check(TokenType.OP_Minus)) {
         this.current = savedPos; 
      }

      // Input statement
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
      
      // Character instantiation
      if (this.check(TokenType.Identifier)) {
        const instanceToken = this.peek();
        
        if (instanceToken.type === TokenType.NumberLiteral || 
            this.isReserved(instanceToken) || 
            instanceToken.type !== TokenType.Identifier) {
             this.validateAndConsumeIdentifier("an instance name");
             if (this.match(TokenType.D_Semicolon)) {
                 return { type: 'CharacterInstantiation', characterType: firstIdentifier.lexeme, instanceName: "ERROR" };
             }
        }

        const secondIdentifier = this.advance();
        
        // Check for hyphenated instance name
        if (this.match(TokenType.OP_Minus)) {
             this.current = savedPos3; 
             this.advance(); 
             this.validateAndConsumeIdentifier("an instance name"); 
             this.consumeSemicolon(); 
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
      
      // Says statement
      if (this.check(TokenType.K_Says)) {
        this.current = savedPos3;
        return this.saysStatement();
      }
      
      // Unknown identifier usage
      this.current = savedPos3;
      const badToken = this.advance(); 
      const suggestion = this.getKeywordSuggestion(badToken.lexeme);
      this.error(badToken, `Invalid statement starting with '${badToken.lexeme}'`, ErrorType.INVALID_STATEMENT, suggestion);
      
      // DON'T throw - just skip to semicolon or next statement
      this.consumeSemicolon();
      return [];
    }

    // Completely unknown token
    const token = this.peek();
    const suggestion = this.getKeywordSuggestion(token.lexeme);
    this.error(token, `Unexpected token: '${token.lexeme}'`, ErrorType.INVALID_STATEMENT, suggestion);
    this.advance();
    return [];
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

    this.consumeSemicolon();
    return declarations;
  }

  private dbDeclaration(): any {
    const name = this.validateAndConsumeIdentifier("a database name");
    this.softConsume(TokenType.OP_Assign, 'Expected "=" after db name');
    const connectionString = this.softConsume(TokenType.TextLiteral, 'Expected connection string');
    this.consumeSemicolon();
    return { type: 'DbDeclaration', name: name.lexeme, connectionString: connectionString.lexeme };
  }

  private assignment(): any {
    const name = this.validateAndConsumeIdentifier("a variable name");
    if (this.match(TokenType.D_Dot)) {
      const property = this.softConsume(TokenType.Identifier, 'Expected property name after "."');
      this.softConsume(TokenType.OP_Assign, 'Expected "=" in assignment');
      const value = this.expression();
      this.consumeSemicolon();
      return { type: 'Assignment', target: { type: 'MemberAccess', object: name.lexeme, property: property.lexeme }, value };
    }
    this.softConsume(TokenType.OP_Assign, 'Expected "=" in assignment');
    const value = this.expression();
    this.consumeSemicolon();
    return { type: 'Assignment', target: name.lexeme, value };
  }

  private conditionalStatement(): any {
    this.softConsume(TokenType.D_LParen, 'Expected "(" after when');
    const condition = this.expression();
    this.softConsume(TokenType.D_RParen, 'Expected ")" after condition');
    this.match(TokenType.N_Then);
    this.softConsume(TokenType.D_LBrace, 'Expected "{" after condition');
    const body = this.statementList();
    this.softConsume(TokenType.D_RBrace, 'Expected "}" to close when block');
    return { type: 'ConditionalStatement', condition, body };
  }

  private characterDeclaration(): any {
    const name = this.validateAndConsumeIdentifier("a character type name");

    if (this.match(TokenType.K_Perceives)) {
       const block = this.perceivesBlock();
       return { type: 'CharacterDeclaration', name: name.lexeme, fields: [], perceivesBlocks: [block] };
    }

    this.softConsume(TokenType.D_LBrace, 'Expected "{" to start character declaration');
    const fields: any[] = [];
    const perceivesBlocks: any[] = [];

    while (!this.check(TokenType.D_RBrace) && !this.isAtEnd()) {
      if (this.match(TokenType.K_Perceives)) {
        perceivesBlocks.push(this.perceivesBlock());
      } else {
        const fieldName = this.validateAndConsumeIdentifier("a character field name");
        this.softConsume(TokenType.D_Colon, 'Expected ":" after field name in character declaration');
        
        // Validate field type
        if (!this.check(TokenType.R_Text) && !this.check(TokenType.R_Number) && !this.check(TokenType.R_Boolean)) {
          const token = this.peek();
          this.error(token, `Invalid field type '${token.lexeme}'. Expected 'text', 'number', or 'boolean'`, ErrorType.INVALID_STATEMENT);
          this.advance();
          this.consumeSemicolon();
          fields.push({ name: fieldName.lexeme, type: 'ERROR' });
          continue;
        }
        
        const fieldType = this.advance();
        this.consumeSemicolon();
        fields.push({ name: fieldName.lexeme, type: TokenType[fieldType.type] });
      }
    }

    this.softConsume(TokenType.D_RBrace, 'Expected "}" to close character declaration');
    return { type: 'CharacterDeclaration', name: name.lexeme, fields, perceivesBlocks };
  }

  private doWhileStatement(): any {
    this.softConsume(TokenType.D_LBrace, 'Expected "{" after do');
    const body = this.statementList();
    this.softConsume(TokenType.D_RBrace, 'Expected "}" after do block');
    this.softConsume(TokenType.K_When, 'Expected "when" after do block');
    this.softConsume(TokenType.D_LParen, 'Expected "(" after when');
    const condition = this.expression();
    this.softConsume(TokenType.D_RParen, 'Expected ")" after condition');
    this.consumeSemicolon();
    return { type: 'DoWhileStatement', body, condition };
  }

  private chooseStatement(): any {
    const variable = this.softConsume(TokenType.Identifier, 'Expected variable after choose');
    this.softConsume(TokenType.D_LBrace, 'Expected "{" after choose variable');
    const cases: any[] = [];
    let defaultCase: any = undefined;
    while (!this.check(TokenType.D_RBrace) && !this.isAtEnd()) {
      if (this.match(TokenType.K_Default)) {
        this.softConsume(TokenType.D_Colon, 'Expected ":" after default');
        const defaultBody = this.statementList();
        defaultCase = { type: 'DefaultCase', body: defaultBody };
        break;
      } else {
        const caseValue = this.advance();
        this.softConsume(TokenType.K_Transition, 'Expected "transition" after case value');
        this.match(TokenType.N_To);
        const target = this.softConsume(TokenType.Identifier, 'Expected scene name');
        this.consumeSemicolon();
        cases.push({ type: 'ChooseCase', value: caseValue.lexeme, target: target.lexeme });
      }
    }
    this.softConsume(TokenType.D_RBrace, 'Expected "}" to close choose');
    return { type: 'ChooseStatement', variable: variable.lexeme, cases, defaultCase };
  }

  private transitionStatement(): any {
    this.match(TokenType.N_To);
    const target = this.softConsume(TokenType.Identifier, 'Expected scene name after transition');
    this.consumeSemicolon();
    return { type: 'TransitionStatement', target: target.lexeme };
  }

  private logStatement(): any {
    const message = this.softConsume(TokenType.TextLiteral, 'Expected message after log');
    this.consumeSemicolon();
    return { type: 'LogStatement', message: message.lexeme };
  }

  private saysStatement(): any {
    const character = this.softConsume(TokenType.Identifier, 'Expected character instance name before "says"');
    this.softConsume(TokenType.K_Says, 'Expected "says" keyword in dialogue statement');
    const message = this.softConsume(TokenType.TextLiteral, 'Expected text message in quotes after "says"');
    this.consumeSemicolon();
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
        return { type: 'EndScene' }; // Return dummy instead of throwing
    }
    this.consumeSemicolon();
    return node;
  }

  // --- 6. EXPRESSION PARSING ---

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
      this.softConsume(TokenType.D_RParen, 'Expected ")" after expression');
      return expr;
    }

    if (this.check(TokenType.Identifier)) {
      const name = this.advance();
      if (this.match(TokenType.D_Dot)) {
        const property = this.softConsume(TokenType.Identifier, 'Expected property or method name after "."');
        if (this.match(TokenType.D_LParen)) {
          const args: Expression[] = [];
          if (!this.check(TokenType.D_RParen)) {
            do { args.push(this.expression()); } while (this.match(TokenType.D_Comma));
          }
          this.softConsume(TokenType.D_RParen, 'Expected ")" after arguments');
          return { type: 'MethodCall', object: name.lexeme, method: property.lexeme, arguments: args };
        }
        return { type: 'MemberAccess', object: name.lexeme, property: property.lexeme };
      }
      if (this.match(TokenType.D_LParen)) {
        const args: Expression[] = [];
        if (!this.check(TokenType.D_RParen)) {
          do { args.push(this.expression()); } while (this.match(TokenType.D_Comma));
        }
        this.softConsume(TokenType.D_RParen, 'Expected ")" after arguments');
        return { type: 'FunctionCall', name: name.lexeme, arguments: args };
      }
      return { type: 'Identifier', name: name.lexeme };
    }

    this.error(this.peek(), 'Expected expression', ErrorType.INVALID_EXPRESSION);
    // Return dummy expression instead of throwing
    return { type: 'Literal', value: 'ERROR' };
  }

  // --- 7. NEW LANGUAGE FEATURES ---
  // These methods handle perceives, thru, masking, and where keywords
  
  /**
   * Parses a perceives block within a character declaration
   * Syntax: perceives <target>[.<table>] { <policies> }
   * Policies can be: masking or where
   */
  private perceivesBlock(): any {
    const target = this.validateAndConsumeIdentifier("a perceives target (character or database name)");
    let fullTarget = target.lexeme;
    if (this.match(TokenType.D_Dot)) {
      const table = this.softConsume(TokenType.Identifier, 'Expected table name after "." in perceives target');
      fullTarget = `${target.lexeme}.${table.lexeme}`;
    }

    this.softConsume(TokenType.D_LBrace, 'Expected "{" to start perceives block');
    const policies: any[] = [];
    while (!this.check(TokenType.D_RBrace) && !this.isAtEnd()) {
      if (this.match(TokenType.K_Masking)) {
        policies.push(this.maskingPolicy());
      } else if (this.match(TokenType.K_Where)) {
        policies.push(this.wherePolicy());
      } else {
        const token = this.peek();
        const suggestion = this.getKeywordSuggestion(token.lexeme);
        const message = suggestion
        ? `Invalid policy in perceives block. Expected 'masking' or 'where', found '${token.lexeme}'. Did you mean '${suggestion}'?`
        : `Invalid policy in perceives block. Expected 'masking' or 'where', found '${token.lexeme}'`;
        this.error(token, message, ErrorType.INVALID_STATEMENT, suggestion);
        this.advance();
        // Try to recover by skipping to semicolon
        while (!this.check(TokenType.D_Semicolon) && !this.check(TokenType.D_RBrace) && !this.isAtEnd()) {
          this.advance();
        }
        if (this.check(TokenType.D_Semicolon)) this.advance();
      }
    }
    this.softConsume(TokenType.D_RBrace, 'Expected "}" to close perceives block');
    return { type: 'PerceivesBlock', target: fullTarget, policies };
  }

  /**
   * Parses a masking policy
   * Syntax: masking <field1>[, <field2>, ...];
   * Specifies which fields should be hidden/masked from the character
   */
  private maskingPolicy(): any {
    const fields: string[] = [];
    
    if (this.check(TokenType.D_Semicolon)) {
      this.error(this.peek(), 'Masking policy requires at least one field name', ErrorType.INVALID_STATEMENT);
      this.advance();
      return { type: 'MaskingPolicy', fields: [] };
    }
    
    do {
      const field = this.validateAndConsumeIdentifier("a field name in masking policy");
      fields.push(field.lexeme);
    } while (this.match(TokenType.D_Comma));
    
    this.consumeSemicolon();
    return { type: 'MaskingPolicy', fields };
  }

  /**
   * Parses a where policy (filtering condition)
   * Syntax: where <condition>;
   * Specifies which rows the character can access based on a condition
   */
  private wherePolicy(): any {
    if (this.check(TokenType.D_Semicolon)) {
      this.error(this.peek(), 'Where policy requires a condition expression', ErrorType.INVALID_STATEMENT);
      this.advance();
      return { type: 'WherePolicy', condition: { type: 'Literal', value: 'ERROR' } };
    }
    
    const condition = this.expression();
    this.consumeSemicolon();
    return { type: 'WherePolicy', condition };
  }

  /**
   * Parses a thru statement (character-scoped execution block)
   * Syntax: thru <characterInstance> { <statements> }
   * Executes statements with the character's data access permissions
   */
  private thruStatement(): any {
    const character = this.validateAndConsumeIdentifier("a character instance name in thru statement");
    this.softConsume(TokenType.D_LBrace, 'Expected "{" to start thru statement block');
    const body = this.statementList();
    this.softConsume(TokenType.D_RBrace, 'Expected "}" to close thru statement block');
    return { type: 'ThruStatement', character: character.lexeme, body };
  }

  private inputStatement(): any {
    this.softConsume(TokenType.OP_Assign, 'Expected "=" in input statement');
    this.softConsume(TokenType.K_Input, 'Expected "input" keyword');
    this.softConsume(TokenType.D_LParen, 'Expected "(" after input'); 
    const prompt = this.softConsume(TokenType.TextLiteral, 'Expected string prompt inside input()');
    this.softConsume(TokenType.D_RParen, 'Expected ")" after prompt');
    this.consumeSemicolon();
    return { type: 'InputStatement', prompt: prompt.lexeme };
  }
}