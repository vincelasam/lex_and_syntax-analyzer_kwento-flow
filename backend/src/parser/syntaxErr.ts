// error interface
export interface SyntaxError {
  message: string;
  line: number;
  column: number;
  token: string;
  type?: ErrorType; 
  suggestion?: string;  
}

// Error categories 
export enum ErrorType {
  UNEXPECTED_TOKEN = 'UNEXPECTED_TOKEN',
  MISSING_TOKEN = 'MISSING_TOKEN',
  INVALID_STATEMENT = 'INVALID_STATEMENT',
  INVALID_EXPRESSION = 'INVALID_EXPRESSION',
}

// Helper class to create consistent error messages 
export class SyntaxErrorBuilder {
  static unexpectedToken(token: string, line: number, column: number, suggestion?: string): SyntaxError {
    return {
      message: `Unexpected token '${token}'`,
      line,
      column,
      token,
      type: ErrorType.UNEXPECTED_TOKEN,
      suggestion
    };
  }

  static expectedToken(expected: string, found: string, line: number, column: number): SyntaxError {
    return {
      message: `Expected '${expected}' but found '${found}'`,
      line,
      column,
      token: found,
      type: ErrorType.MISSING_TOKEN,
      suggestion: `Insert '${expected}'`
    };
  }

  static missingClosingBrace(line: number, column: number): SyntaxError {
    return {
      message: 'Missing closing brace "}"',
      line,
      column,
      token: '}',
      type: ErrorType.MISSING_TOKEN,
      suggestion: 'Insert "}"'
    };
  }

  static missingSemicolon(line: number, column: number, token: string): SyntaxError {
    return {
      message: 'Expected ";" after statement',
      line,
      column,
      token,
      type: ErrorType.MISSING_TOKEN,
      suggestion: "Insert ';'"
    };
  }

  static invalidStatement(token: string, line: number, column: number, suggestion?: string): SyntaxError {
    const message = suggestion
      ? `Unknown statement '${token}'. Did you mean '${suggestion}'?`
      : `Invalid statement starting with '${token}'`;
    
    return {
      message: message,
      line,
      column,
      token,
      type: ErrorType.INVALID_STATEMENT,
      suggestion
    };
  }

  static invalidExpression(token: string, line: number, column: number): SyntaxError {
    return {
      message: `Invalid expression at '${token}'`,
      line,
      column,
      token,
      type: ErrorType.INVALID_EXPRESSION
    };
  }
}